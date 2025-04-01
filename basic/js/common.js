// 창 크기가 변경될 때도 margin 조정
function setHeaderMargin() {
    const header = document.getElementById('header');
    const footer = document.getElementById('footer');
    const container = document.getElementById('container');
    const aboutPartSection = document.getElementById('aboutPartSection');
    
    if (footer && header && container) {
        const headerHeight = header.offsetHeight;
        const footerHeight = footer.offsetHeight;
        container.style.marginTop = headerHeight + 'px';
        container.style.paddingBottom = footerHeight + 'px';
    }
    
    // aboutPartSection에도 header 높이만큼 margin-top 추가
    if (aboutPartSection && header) {
        const headerHeight = header.offsetHeight;
        const footerHeight = footer.offsetHeight;
        aboutPartSection.style.marginTop = headerHeight + 'px';
        aboutPartSection.style.paddingBottom = footerHeight + 'px';
    }
}

// 레이아웃이 로드된 후 마진 설정
document.addEventListener('layoutLoaded', setHeaderMargin);

// 윈도우 리사이즈시에도 마진 재설정
window.addEventListener('resize', setHeaderMargin);