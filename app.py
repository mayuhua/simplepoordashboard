import streamlit as st
import pandas as pd
import plotly.graph_objects as go
import plotly.express as px
from plotly.subplots import make_subplots
import numpy as np
from io import BytesIO

st.set_page_config(
    page_title="Temu PSP Tracker",
    page_icon="📊",
    layout="wide",
    initial_sidebar_state="expanded"
)

# 自定义CSS样式
st.markdown("""
<style>
.metric-card {
    background-color: white;
    padding: 1rem;
    border-radius: 0.5rem;
    border: 1px solid #e5e7eb;
    box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
}

.country-header {
    background-color: #f3f4f6;
    padding: 1rem;
    border-radius: 0.5rem;
    margin: 1rem 0;
    border-left: 4px solid #3b82f6;
}

.plotly-container {
    background-color: white;
    padding: 1rem;
    border-radius: 0.5rem;
    border: 1px solid #e5e7eb;
    margin: 0.5rem 0;
}
</style>
""", unsafe_allow_html=True)

class PSPAnalyzer:
    def __init__(self):
        self.data = None
        self.processed_data = None

    def load_excel(self, file):
        """加载Excel文件"""
        try:
            # 尝试读取第一个工作表
            df = pd.read_excel(file, engine='openpyxl')
            st.success(f"✅ 成功加载 {len(df)} 行数据")
            return df
        except Exception as e:
            st.error(f"❌ 文件加载失败: {str(e)}")
            return None

    def detect_columns(self, df):
        """智能检测列名"""
        # 列名映射字典
        column_mapping = {
            'country': ['country', 'Country', 'COUNTRY', 'market', 'Market', 'MARKET'],
            'psp': ['psp', 'PSP', 'payment service provider', 'Payment Provider', 'provider', 'Provider'],
            'week': ['week', 'Week', 'WEEK', 'date', 'Date', 'period', 'Period'],
            'press_buy': ['press buy count', 'press_buy_count', 'PressBuyCount', 'press buy', 'buys', 'Buys'],
            'converted': ['converted count', 'converted_count', 'ConvertedCount', 'converted', 'conversions', 'Conversions'],
            'payment_option': ['last selected payment option', 'payment option', 'payment method']
        }

        detected_columns = {}
        available_columns = df.columns.tolist()

        for target_col, possible_names in column_mapping.items():
            for possible_name in possible_names:
                # 精确匹配
                if possible_name in available_columns:
                    detected_columns[target_col] = possible_name
                    break
                # 模糊匹配（忽略大小写）
                for col in available_columns:
                    if possible_name.lower() in col.lower() or col.lower() in possible_name.lower():
                        detected_columns[target_col] = col
                        break
                if target_col in detected_columns:
                    break

        return detected_columns

    def process_data(self, df):
        """处理和计算指标"""
        # 检测列名
        detected_columns = self.detect_columns(df)

        if not all(col in detected_columns for col in ['country', 'psp', 'week', 'press_buy', 'converted']):
            st.error("❌ 无法识别必要的数据列，请检查文件格式")
            return None

        # 重命名列
        df_processed = df.rename(columns={v: k for k, v in detected_columns.items()})

        # 确保数据类型正确
        numeric_columns = ['press_buy', 'converted']
        for col in numeric_columns:
            df_processed[col] = pd.to_numeric(df_processed[col], errors='coerce').fillna(0)

        # 计算转换率
        df_processed['conversion_rate'] = (df_processed['converted'] / df_processed['press_buy'] * 100).round(2)
        df_processed['conversion_rate'] = df_processed['conversion_rate'].replace([np.inf, -np.inf], 0)

        # 计算shares（按国家和周分组）
        def calculate_shares(group):
            total_press_buy = group['press_buy'].sum()
            total_converted = group['converted'].sum()

            group['press_buy_share'] = (group['press_buy'] / total_press_buy * 100).round(2) if total_press_buy > 0 else 0
            group['converted_share'] = (group['converted'] / total_converted * 100).round(2) if total_converted > 0 else 0
            return group

        df_processed = df_processed.groupby(['country', 'week']).apply(calculate_shares).reset_index(drop=True)

        self.processed_data = df_processed
        return df_processed

def create_chart(data, countries, psps, metric_config, chart_type='line'):
    """创建图表"""
    fig = go.Figure()

    colors = px.colors.qualitative.Set3

    for i, psp in enumerate(psps):
        for country in countries:
            country_data = data[data['country'] == country]
            psp_data = country_data[country_data['psp'] == psp]

            if len(psp_data) == 0:
                continue

            color = colors[i % len(colors)]

            if chart_type == 'line':
                fig.add_trace(go.Scatter(
                    x=psp_data['week'],
                    y=psp_data[metric_config['column']],
                    mode='lines+markers',
                    name=f'{psp} ({country})',
                    line=dict(color=color),
                    marker=dict(size=4)
                ))
            elif chart_type == 'bar':
                fig.add_trace(go.Bar(
                    x=psp_data['week'],
                    y=psp_data[metric_config['column']],
                    name=f'{psp} ({country})',
                    marker_color=color
                ))

    fig.update_layout(
        title=metric_config['title'],
        xaxis_title='Week',
        yaxis_title=metric_config['yaxis_title'],
        height=400,
        hovermode='x unified'
    )

    if metric_config['format'] == 'percentage':
        fig.update_yaxis(tickformat='.1f')

    return fig

# Streamlit应用主体
def main():
    st.title("📊 Temu PSP Tracker")
    st.markdown("分析支付服务提供商(PSP)在各国家的性能表现")

    # 初始化分析器
    if 'analyzer' not in st.session_state:
        st.session_state.analyzer = PSPAnalyzer()

    analyzer = st.session_state.analyzer

    # 文件上传区域
    st.header("📁 数据上传")
    uploaded_file = st.file_uploader(
        "上传Excel文件",
        type=['xlsx', 'xls'],
        help="支持.xlsx和.xls格式的Excel文件"
    )

    if uploaded_file is not None:
        # 加载和处理数据
        with st.spinner("正在处理数据..."):
            df = analyzer.load_excel(uploaded_file)

            if df is not None:
                processed_data = analyzer.process_data(df)

                if processed_data is not None:
                    st.session_state.data = processed_data

                    # 显示数据概览
                    st.header("📈 数据概览")

                    col1, col2, col3, col4 = st.columns(4)

                    with col1:
                        st.metric(
                            "国家数量",
                            processed_data['country'].nunique()
                        )

                    with col2:
                        st.metric(
                            "PSP数量",
                            processed_data['psp'].nunique()
                        )

                    with col3:
                        st.metric(
                            "周数量",
                            processed_data['week'].nunique()
                        )

                    with col4:
                        total_press_buys = processed_data['press_buy'].sum()
                        st.metric(
                            "总Press Buy",
                            f"{total_press_buys:,}"
                        )

                    # 筛选器
                    st.header("🔍 数据筛选")

                    col1, col2, col3 = st.columns(3)

                    with col1:
                        selected_countries = st.multiselect(
                            "选择国家",
                            options=processed_data['country'].unique().tolist(),
                            default=processed_data['country'].unique().tolist()
                        )

                    with col2:
                        selected_psps = st.multiselect(
                            "选择PSP",
                            options=processed_data['psp'].unique().tolist(),
                            default=processed_data['psp'].unique().tolist()
                        )

                    with col3:
                        if 'payment_option' in processed_data.columns:
                            selected_payment_options = st.multiselect(
                                "支付选项",
                                options=processed_data['payment_option'].dropna().unique().tolist(),
                                default=[]
                            )
                        else:
                            selected_payment_options = []

                    # 应用筛选
                    filtered_data = processed_data[
                        (processed_data['country'].isin(selected_countries)) &
                        (processed_data['psp'].isin(selected_psps))
                    ]

                    if selected_payment_options and 'payment_option' in filtered_data.columns:
                        filtered_data = filtered_data[
                            filtered_data['payment_option'].isin(selected_payment_options) |
                            filtered_data['payment_option'].isna()
                        ]

                    # 按国家分组显示
                    st.header("📊 按国家分组的性能分析")

                    metrics_config = [
                        {
                            'column': 'press_buy',
                            'title': 'Press Buy Count',
                            'yaxis_title': 'Press Buy Count',
                            'format': 'number',
                            'chart_type': 'line'
                        },
                        {
                            'column': 'converted',
                            'title': 'Converted Count',
                            'yaxis_title': 'Converted Count',
                            'format': 'number',
                            'chart_type': 'line'
                        },
                        {
                            'column': 'conversion_rate',
                            'title': 'Conversion Rate (%)',
                            'yaxis_title': 'Conversion Rate (%)',
                            'format': 'percentage',
                            'chart_type': 'bar'
                        },
                        {
                            'column': 'press_buy_share',
                            'title': 'Press Buy Share (%)',
                            'yaxis_title': 'Press Buy Share (%)',
                            'format': 'percentage',
                            'chart_type': 'bar'
                        },
                        {
                            'column': 'converted_share',
                            'title': 'Converted Share (%)',
                            'yaxis_title': 'Converted Share (%)',
                            'format': 'percentage',
                            'chart_type': 'bar'
                        }
                    ]

                    for country in selected_countries:
                        country_data = filtered_data[filtered_data['country'] == country]

                        st.markdown(f"""
                        <div class="country-header">
                            <h3>🌍 {country}</h3>
                            <p>{len(country_data)} 数据点，{len(country_data['psp'].unique())} 个PSP</p>
                        </div>
                        """, unsafe_allow_html=True)

                        # 汇总统计
                        country_stats = country_data.groupby('psp').agg({
                            'press_buy': 'sum',
                            'converted': 'sum',
                            'conversion_rate': 'mean'
                        }).reset_index()

                        col1, col2, col3 = st.columns(3)

                        for i, (_, stat) in enumerate(country_stats.iterrows()):
                            with [col1, col2, col3][i % 3]:
                                st.markdown(f"""
                                <div class="metric-card">
                                    <h4>{stat['psp']}</h4>
                                    <p>Press Buy: {stat['press_buy']:,}</p>
                                    <p>Converted: {stat['converted']:,}</p>
                                    <p>Avg CR: {stat['conversion_rate']:.1f}%</p>
                                </div>
                                """, unsafe_allow_html=True)

                        # 图表
                        for metric in metrics_config:
                            fig = create_chart(
                                country_data,
                                [country],
                                selected_psps,
                                metric,
                                metric['chart_type']
                            )

                            st.markdown('<div class="plotly-container">', unsafe_allow_html=True)
                            st.plotly_chart(fig, use_container_width=True)
                            st.markdown('</div>', unsafe_allow_html=True)

if __name__ == "__main__":
    main()