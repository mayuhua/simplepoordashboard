#!/usr/bin/env python3
"""
启动 Temu PSP Tracker Python 版本
"""

import subprocess
import sys
import os

def check_dependencies():
    """检查并安装依赖"""
    required_packages = [
        'streamlit', 'pandas', 'plotly',
        'openpyxl', 'xlrd', 'numpy'
    ]

    missing_packages = []

    for package in required_packages:
        try:
            __import__(package.replace('-', '_'))
        except ImportError:
            missing_packages.append(package)

    if missing_packages:
        print(f"📦 安装缺失的依赖包: {', '.join(missing_packages)}")
        subprocess.check_call([
            sys.executable, '-m', 'pip', 'install'
        ] + missing_packages)
        print("✅ 依赖包安装完成")

def main():
    """主函数"""
    print("🚀 启动 Temu PSP Tracker Python 版本...")

    # 检查依赖
    check_dependencies()

    # 启动 Streamlit 应用
    print("🌐 正在启动 Web 应用...")
    print("📊 应用将在浏览器中打开: http://localhost:8501")
    print("📁 请准备好您的 Excel 文件 (rawdata/test2025.xlsx)")
    print("⏹️  按 Ctrl+C 停止应用")

    try:
        subprocess.run([
            sys.executable, '-m', 'streamlit', 'run', 'app.py',
            '--server.port', '8501',
            '--server.headless', 'false'
        ])
    except KeyboardInterrupt:
        print("\n👋 应用已停止")
    except Exception as e:
        print(f"❌ 启动失败: {e}")
        print("💡 请确保所有依赖包已正确安装")

if __name__ == "__main__":
    main()