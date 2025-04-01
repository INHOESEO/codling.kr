// CSS와 HTML 매핑 정보
const resourceMap = {
    'layout': { //250201 생성
        html: '../basic/layout.html',
        css: ['../basic/css/common.css', '../basic/css/header.css', '../basic/css/footer.css']
    },
    'header': { //250201 생성
        html: '../basic/header.html',
        css: ['../basic/css/header.css']
    },
    'footer': { //250201 생성
        html: '../basic/footer.html',
        css: ['../basic/css/footer.css']
    },
    'mainThreedSection': { //250201 생성
        html: '../section/main/main-threed-section.html',
        css: ['../section/css/main-threed-section.css']
    },
    'mainCategorySection': { //250301 생성
        html: '../section/main/main-category-section.html',
        css: ['../section/css/main-category-section.css']
    },
    'memberTeamSection': { //250401 생성
        html: '../section/member/member-team-section.html',
        css: ['../section/css/member-team-section.css']
    },
    'aboutBannerSection': { //250401 생성
        html: '../section/about/about-banner-section.html', 
        css: ['../section/css/about-banner-section.css']
    },
    'aboutIntroSection': { //250401 생성
        html: '../section/about/about-intro-section.html', 
        css: ['../section/css/about-intro-section.css']
    },
    'aboutPartSection': { //250401 생성
        html: '../section/about/about-part-section.html', 
        css: ['../section/css/about-part-section.css']
    },
    'brandListSection': { //250401 생성
        html: '../section/brand/brand-list-section.html', 
        css: ['../section/css/brand-list-section.css']
    }
};

// HTML 캐시를 위한 객체
const htmlCache = {};

// 모든 CSS 파일을 미리 로드하는 함수
async function preloadAllCSS() {
    const allCSSFiles = new Set();
    
    // 모든 CSS 파일을 수집
    Object.values(resourceMap).forEach(resource => {
        if (resource.css) {
            resource.css.forEach(css => allCSSFiles.add(css));
        }
    });
    
    // 각 CSS 파일을 로드
    const cssPromises = Array.from(allCSSFiles).map(cssPath => loadCSS(cssPath));
    
    // 모든 CSS 로드 완료를 기다림
    return Promise.all(cssPromises);
}

// CSS 파일 로드 함수
function loadCSS(path) {
    return new Promise((resolve, reject) => {
        // 이미 로드된 CSS는 다시 로드하지 않음
        if (document.querySelector(`link[href="${path}"]`)) {
            resolve();
            return;
        }
        
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.type = 'text/css';
        link.href = path;
        
        link.onload = resolve;
        link.onerror = reject;
        
        document.head.appendChild(link);
    });
}

// HTML 파일 로드 함수
async function loadHTML(elementId, path) {
    try {
        const element = document.getElementById(elementId);
        if (!element) {
            return;
        }

        // HTML 로드 (캐시된 값이 있으면 사용)
        let html;
        if (htmlCache[path]) {
            html = htmlCache[path];
        } else {
            const response = await fetch(path);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            html = await response.text();
            htmlCache[path] = html; // 캐시에 저장
        }
        
        // HTML 파싱
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        // live-server 스크립트 제거
        const cleanDoc = removeLiveServerScripts(doc);

        // 추가 CSS 링크 처리 (HTML 내에 정의된 추가 CSS)
        Array.from(cleanDoc.getElementsByTagName('link')).forEach(link => {
            const href = link.getAttribute('href');
            if (href && !document.querySelector(`link[href="${href}"]`)) {
                loadCSS(href); // 여기서는 await하지 않음 (이미 주요 CSS는 로드했기 때문)
            }
        });

        // body 내용 삽입
        if (elementId === 'layout') {
            element.innerHTML = cleanDoc.body.innerHTML;
        } else {
            const mainContent = cleanDoc.body.querySelector(`#${elementId}Inner`);
            if (mainContent) {
                element.innerHTML = mainContent.outerHTML;
            } else {
                element.innerHTML = cleanDoc.body.innerHTML;
            }
        }

        // 스크립트 처리
        const scripts = Array.from(cleanDoc.getElementsByTagName('script')).filter(script => {
            return !script.textContent.includes('live-server') && 
                   !script.textContent.includes('WebSocket');
        });

        // 순차적으로 스크립트 로드
        for (const script of scripts) {
            try {
                await loadScript(script);
            } catch (error) {
                console.error('Script load error:', error);
            }
        }

        // layoutLoaded 이벤트 발생
        if (elementId === 'layout') {
            document.dispatchEvent(new CustomEvent('layoutLoaded'));
        }
    } catch (error) {
        console.error(`Error loading ${elementId}:`, error);
    }
}

// 헬퍼 함수들
function removeLiveServerScripts(doc) {
    const scripts = doc.getElementsByTagName('script');
    Array.from(scripts).forEach(script => {
        if (script.textContent.includes('live-server') || 
            script.textContent.includes('WebSocket')) {
            script.remove();
        }
    });
    return doc;
}

function loadScript(script) {
    return new Promise((resolve, reject) => {
        if (script.src) {
            // 이미 로드된 스크립트는 스킵
            if (document.querySelector(`script[src="${script.src}"]`)) {
                resolve();
                return;
            }
            
            const newScript = document.createElement('script');
            newScript.src = script.src;
            
            // 모듈 스크립트 처리
            if (script.type === 'module') {
                newScript.type = 'module';
            }
            
            newScript.onload = resolve;
            newScript.onerror = reject;
            document.body.appendChild(newScript);
        } else {
            const newScript = document.createElement('script');
            
            // 인라인 모듈 스크립트 처리
            if (script.type === 'module') {
                newScript.type = 'module';
            }
            
            newScript.textContent = script.textContent;
            document.body.appendChild(newScript);
            resolve();
        }
    });
}

// HTML에서 live-server 스크립트 제거
function cleanHTML(html) {
    return html.replace(
        /<script[\s\S]*?<\/script>/gi,
        match => match.includes('live-server') ? '' : match
    );
}

// 레이아웃 초기화 함수
async function initLayout() {
    try {
        // 모든 CSS를 먼저 로드
        console.time('CSS 로드 시간');
        await preloadAllCSS();
        console.timeEnd('CSS 로드 시간');
        
        // 그 다음 HTML 로드
        console.time('레이아웃 로드 시간');
        await loadHTML('layout', resourceMap['layout'].html);
        console.timeEnd('레이아웃 로드 시간');
        
        // 기본 요소 로드 (헤더, 푸터)
        await Promise.all([
            loadHTML('header', resourceMap['header'].html),
            loadHTML('footer', resourceMap['footer'].html)
        ]);
        
        // 다른 섹션 로드 (병렬로)
        console.time('섹션 로드 시간');
        const sectionPromises = [
            'mainThreedSection',
            'mainCategorySection',
            'memberTeamSection',
            'aboutBannerSection',
            'aboutIntroSection',
            'aboutPartSection',
            'brandListSection'
        ]
        .filter(id => document.getElementById(id) !== null) // 페이지에 존재하는 섹션만 로드
        .map(id => loadHTML(id, resourceMap[id].html));
        
        await Promise.all(sectionPromises);
        console.timeEnd('섹션 로드 시간');
        
    } catch (error) {
        console.error('Layout 초기화 중 에러 발생:', error);
    }
}

// 페이지 로드 즉시 CSS 로드 시작
(async function immediateStart() {
    // 바로 CSS 로드 시작
    try {
        await preloadAllCSS();
        console.log('사전 CSS 로드 완료');
    } catch (error) {
        console.error('사전 CSS 로드 중 에러:', error);
    }
})();

// DOM이 준비되면 초기화 시작
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLayout);
} else {
    // DOM이 이미 로드됨, 즉시 시작
    initLayout();
}