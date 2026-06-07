#!/bin/bash

# ChatArchiver 浏览器扩展打包脚本

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
EXTENSION_DIR="$SCRIPT_DIR/extension"
BUILD_DIR="$SCRIPT_DIR/build"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

echo_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

echo_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 清理构建目录
clean_build() {
    if [ -d "$BUILD_DIR" ]; then
        rm -rf "$BUILD_DIR"
        echo_info "清理构建目录: $BUILD_DIR"
    fi
    mkdir -p "$BUILD_DIR"
}

# 打包单个浏览器扩展
package_extension() {
    local browser=$1
    local source_dir="$EXTENSION_DIR/$browser"
    local output_file="$BUILD_DIR/chatarchiver-$browser.zip"
    
    if [ ! -d "$source_dir" ]; then
        echo_error "未找到 $browser 扩展目录: $source_dir"
        return 1
    fi
    
    echo_info "打包 $browser 扩展..."
    
    # 检查manifest.json是否存在
    if [ ! -f "$source_dir/manifest.json" ]; then
        echo_error "未找到 $source_dir/manifest.json"
        return 1
    fi
    
    # 创建zip文件
    cd "$source_dir"
    zip -r "$output_file" . -x "*.DS_Store" -x "__MACOSX/*"
    cd "$SCRIPT_DIR"
    
    # 获取文件大小
    local size=$(du -h "$output_file" | cut -f1)
    echo_info "$browser 打包完成: $output_file ($size)"
}

# 显示帮助信息
show_help() {
    echo "用法: $0 [选项]"
    echo ""
    echo "选项:"
    echo "  chrome    打包Chrome扩展"
    echo "  edge      打包Edge扩展"
    echo "  firefox   打包Firefox扩展"
    echo "  all       打包所有浏览器扩展"
    echo "  help      显示帮助信息"
    echo ""
    echo "示例:"
    echo "  $0 chrome      # 只打包Chrome扩展"
    echo "  $0 all         # 打包所有扩展"
    echo "  $0             # 交互式选择"
}

# 交互式选择
interactive_select() {
    echo ""
    echo "请选择要打包的浏览器扩展:"
    echo "  1) Chrome"
    echo "  2) Edge"
    echo "  3) Firefox"
    echo "  4) 所有"
    echo ""
    read -p "请输入选项 [1-4]: " choice
    
    case $choice in
        1) package_extension "chrome" ;;
        2) package_extension "edge" ;;
        3) package_extension "firefox" ;;
        4) 
            package_extension "chrome"
            package_extension "edge"
            package_extension "firefox"
            ;;
        *) 
            echo_error "无效选项"
            exit 1
            ;;
    esac
}

# 主函数
main() {
    echo ""
    echo "=========================================="
    echo "  ChatArchiver 浏览器扩展打包工具"
    echo "=========================================="
    echo ""
    
    # 清理并创建构建目录
    clean_build
    
    # 根据参数执行
    case "${1:-}" in
        chrome)
            package_extension "chrome"
            ;;
        edge)
            package_extension "edge"
            ;;
        firefox)
            package_extension "firefox"
            ;;
        all)
            package_extension "chrome"
            package_extension "edge"
            package_extension "firefox"
            ;;
        help|--help|-h)
            show_help
            exit 0
            ;;
        "")
            interactive_select
            ;;
        *)
            echo_error "未知选项: $1"
            show_help
            exit 1
            ;;
    esac
    
    echo ""
    echo_info "打包完成！文件位于: $BUILD_DIR"
    echo ""
    ls -lh "$BUILD_DIR"
    echo ""
}

main "$@"