// SVG 회전 애니메이션 초기화 함수
function initRotatingAnimation() {
    console.log('배너섹션js: 애니메이션 초기화 시작');
    
    // 스타일 추가
    const style = document.createElement('style');
    style.textContent = `
      @keyframes rotateAndStop {
        0% {
          transform: rotate(0deg);
        }
        60% {
          transform: rotate(720deg); /* 두 바퀴 회전 */
        }
        100% {
          transform: rotate(720deg); /* 최종 위치로 돌아오기 */
        }
      }
      
      #aboutBannerSectionInner > div > img:first-child {
        animation: rotateAndStop 3s ease-out forwards;
        transform-origin: center center;
      }
    `;
    
    document.head.appendChild(style);
    console.log('배너섹션js: 애니메이션 스타일 추가됨');
    
    // 애니메이션 리셋 함수
    function resetAnimation() {
        const symbolImg = document.querySelector('#aboutBannerSectionInner > div > img:first-child');
        if (symbolImg) {
            // 애니메이션 리셋을 위해 요소 복제 후 교체
            const parent = symbolImg.parentNode;
            const clone = symbolImg.cloneNode(true);
            parent.replaceChild(clone, symbolImg);
        }
    }
    
    // IntersectionObserver 설정
    const setupObserver = function() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    resetAnimation();
                }
            });
        }, { threshold: 0.5 });
        
        const bannerSection = document.getElementById('aboutBannerSection');
        if (bannerSection) {
            observer.observe(bannerSection);
        } 
    };
    
    // DOM이 준비되면 애니메이션 시작
    function checkForBannerSection() {
        const section = document.getElementById('aboutBannerSectionInner');
        if (section) {
            console.log('배너섹션js: 배너 섹션 요소 찾음');
            clearInterval(checkInterval);
            resetAnimation();
            setupObserver();
        }
    }
    
    // 100ms마다 배너 섹션 확인
    const checkInterval = setInterval(checkForBannerSection, 100);
    
    // 타임아웃 설정 (10초 후 중지)
    setTimeout(() => {
        clearInterval(checkInterval);
    }, 10000);
}

// DOMContentLoaded 이벤트에 초기화 함수 바인딩
document.addEventListener('DOMContentLoaded', function() {
    initRotatingAnimation();
});

// 이미 DOM이 로드되었다면 바로 초기화
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    initRotatingAnimation();
}