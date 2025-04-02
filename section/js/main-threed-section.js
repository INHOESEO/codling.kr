// 이미 로드된 라이브러리 확인 함수
function isScriptLoaded(url) {
    return Array.from(document.getElementsByTagName('script'))
        .some(script => script.src === url);
}

// 필요한 라이브러리 동적 로드 함수
function loadScriptIfNeeded(url) {
    return new Promise((resolve, reject) => {
        if (isScriptLoaded(url)) {
            resolve();
            return;
        }
        
        const script = document.createElement('script');
        script.src = url;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

// 필요한 라이브러리 로드
async function loadRequiredLibraries() {
    try {
        // 라이브러리가 이미 로드되어 있는지 확인
        if (typeof THREE === 'undefined') {
            await loadScriptIfNeeded('https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js');
        }
        
        if (typeof THREE !== 'undefined') {
            if (typeof THREE.GLTFLoader === 'undefined' && typeof GLTFLoader === 'undefined') {
                await loadScriptIfNeeded('https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/GLTFLoader.js');
            }
            
            if (typeof THREE.OrbitControls === 'undefined' && typeof OrbitControls === 'undefined') {
                await loadScriptIfNeeded('https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js');
            }
        }
        
        console.log('THREE 라이브러리 로드 완료:', typeof THREE);
        console.log('GLTFLoader 로드 완료:', typeof THREE !== 'undefined' ? typeof THREE.GLTFLoader : 'THREE 없음');
        console.log('OrbitControls 로드 완료:', typeof THREE !== 'undefined' ? typeof THREE.OrbitControls : 'THREE 없음');
        
        // 모듈 설정이 필요한 경우 처리
        if (typeof THREE !== 'undefined') {
            if (typeof GLTFLoader !== 'undefined' && typeof THREE.GLTFLoader === 'undefined') {
                THREE.GLTFLoader = GLTFLoader;
            }
            if (typeof OrbitControls !== 'undefined' && typeof THREE.OrbitControls === 'undefined') {
                THREE.OrbitControls = OrbitControls;
            }
        }
        
        // Three.js 컨테이너가 있으면 3D 모델 초기화
        const container = document.getElementById('greenappleViewContainer');
        if (container) {
            console.log('3D 모델 초기화 시작');
            initThreeJsScene();
        }
        
        // 카테고리 컨테이너가 있으면 회전 카테고리 초기화
        const categoryContainer = document.querySelector('.main-category-list-wrapper');
        if (categoryContainer) {
            console.log('회전 카테고리 초기화 시작');
            initRotatingCategories();
        }
    } catch (error) {
        console.error('라이브러리 로드 중 오류 발생:', error);
    }
}

// 회전 카테고리 초기화 함수
function initRotatingCategories() {
    console.log("회전 카테고리 초기화 시작");
    
    // 요소 참조
    const listWrapper = document.querySelector('.main-category-list-wrapper');
    if (!listWrapper) {
        console.warn('main-category-list-wrapper를 찾을 수 없습니다.');
        return;
    }
    
    const categoryItems = document.querySelectorAll('.main-category-list');
    const contentItems = document.querySelectorAll('.main-category-content');
    
    // 카테고리 총 개수
    const totalItems = categoryItems.length;
    console.log(`카테고리 항목 개수: ${totalItems}`);
    
    // 회전 설정
    const radius = 150; // 원형 배치 반경
    const angleStep = (2 * Math.PI) / totalItems; // 각 항목 사이의 각도
    
    // 상태 관리 객체
    const state = {
        activeIndex: 1,
        isRotating: false,
        lastRotationTimestamp: 0,
        autoRotateTimer: null,
        rotationDirection: 1 // 1: 정방향, -1: 역방향
    };
    
    // 값 범위 변환 함수
    function mapRange(value, inMin, inMax, outMin, outMax) {
        return ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
    }
    
    // 초기 위치 설정 - CSS 대신 JavaScript로 직접 배치
    function positionItems() {
        categoryItems.forEach((item, i) => {
            // 정확히 중앙에 활성 카테고리가 오도록 계산
            const baseAngle = angleStep * (i - state.activeIndex);
            
            // 극좌표를 데카르트 좌표로 변환
            const x = Math.sin(baseAngle) * radius;
            const z = Math.cos(baseAngle) * radius;
            
            // 앞에 있는 항목일수록 크고 선명하게
            const absAngle = Math.abs(baseAngle);
            const scale = mapRange(absAngle, 0, Math.PI, 1.2, 0.8);
            const opacity = mapRange(absAngle, 0, Math.PI, 1, 0.5);
            
            // 변환 적용 - transform-origin을 명시적으로 지정
            item.style.transformOrigin = 'center center';
            item.style.transform = `translateX(${x}px) translateZ(${z}px) scale(${scale})`;
            item.style.opacity = opacity;
            
            // z-index 조정 (앞에 있는 항목이 위에 오도록)
            item.style.zIndex = Math.round(1000 - absAngle * 100);
        });
    }
    
    // 자동 회전 중지 함수
    function stopAutoRotate() {
        if (state.autoRotateTimer) {
            clearTimeout(state.autoRotateTimer);
            state.autoRotateTimer = null;
        }
    }
    
    // 항목 활성화 함수
    function setActiveItem(index, skipSync = false) {
        // 인덱스 범위 확인 및 순환 구조
        if (index < 0) index = totalItems - 1;
        if (index >= totalItems) index = 0;
        
        // 현재 회전 중이거나 현재 활성 인덱스와 동일한 경우 무시
        if (state.isRotating || state.activeIndex === index) {
            return false;
        }
        
        // 현재 시간 체크
        const now = Date.now();
        
        // 최소 회전 간격
        if (now - state.lastRotationTimestamp < 350) {
            return false;
        }
        
        // 자동 회전 중지
        stopAutoRotate();
        
        // 회전 상태 설정
        state.isRotating = true;
        state.lastRotationTimestamp = now;
        
        // 회전 방향은 상관없이 항상 시각적으로 가장 짧은 경로 선택
        // UI 업데이트
        categoryItems.forEach(item => item.classList.remove('active'));
        categoryItems[index].classList.add('active');
        
        contentItems.forEach(content => {
            if(content) content.style.display = 'none';
        });
        
        if(contentItems[index]) contentItems[index].style.display = 'flex';
        
        // 애니메이션 시간 계산 - 간단하게 다시 설정
        const animationDuration = 500;
        
        // 포지션 업데이트
        listWrapper.style.transition = `transform ${animationDuration}ms ease-out`;
        
        // 활성 인덱스 업데이트
        state.activeIndex = index;
        
        // 포지션 재계산
        positionItems();
        
        console.log(`카테고리 #${index} 활성화 (애니메이션 시간: ${animationDuration}ms)`);
        
        // 3D 모델과 동기화 (순환 호출 방지)
        if (!skipSync && typeof window.activateMenuItem === 'function') {
            window.activateMenuItem(index, false);
        }
        
        // 애니메이션 종료 후 회전 상태 해제 및 자동 회전 재시작
        setTimeout(() => {
            state.isRotating = false;
            
            // 자동 회전 재시작 (약간 지연)
            setTimeout(() => {
                if (!isDragging) {
                    startAutoRotate();
                }
            }, 500);
        }, animationDuration + 50);
        
        return true;
    }
        
    // 자동 회전 시작 함수
    function startAutoRotate() {
        // 이미 회전 중이거나 타이머가 있으면 무시
        if (state.isRotating || state.autoRotateTimer) {
            return;
        }
        
        // 다음 인덱스 계산 (항상 시계 방향으로만 진행)
        const nextIndex = (state.activeIndex + 1) % totalItems;
        
        state.autoRotateTimer = setTimeout(() => {
            // 타이머 초기화
            state.autoRotateTimer = null;
            
            // 자동 회전은 항상 다음 인덱스로만 이동 (항상 정방향)
            setActiveItem(nextIndex, false);
        }, 5000);
    }
    
    // 각 카테고리 항목에 클릭 이벤트 리스너 추가
    categoryItems.forEach((item, index) => {
        item.addEventListener('click', function(e) {
            // a 태그를 클릭했고 href 속성이 없으면 기본 동작 방지
            if (e.target.tagName === 'A' && !e.target.getAttribute('href')) {
                e.preventDefault();
            }
            
            // 클릭한 항목 활성화
            setActiveItem(index);
        });
    });
    
    // 드래그 관련 변수
    let isDragging = false;
    let startX = 0;
    let startIndex = state.activeIndex;
    
    // 드래그 시작
    listWrapper.addEventListener('mousedown', function(e) {
        if (state.isRotating) return; // 회전 중일 때는 드래그 방지
        
        isDragging = true;
        startX = e.clientX;
        startIndex = state.activeIndex;
        
        // 애니메이션 일시 중지
        listWrapper.style.transition = 'none';
        
        // 자동 회전 중지
        stopAutoRotate();
        
        e.preventDefault();
    });
    
    // 드래그 중
    window.addEventListener('mousemove', function(e) {
        if (!isDragging || state.isRotating) return;
        
        const deltaX = e.clientX - startX;
        
        // 드래그 거리에 따른 인덱스 변경
        const dragThreshold = 100; // 드래그 임계값
        const potentialIndex = startIndex + Math.round(deltaX / dragThreshold);
        const newIndex = Math.max(0, Math.min(totalItems - 1, potentialIndex));
        
        if (newIndex !== state.activeIndex) {
            setActiveItem(newIndex);
        }
    });
    
    // 드래그 종료
    window.addEventListener('mouseup', function() {
        if (!isDragging || state.isRotating) return;
        isDragging = false;
        
        // 드래그 후 일정 시간 후에만 자동 회전 재개
        setTimeout(() => {
            if (!state.isRotating) {
                startAutoRotate();
            }
        }, 1500); // 1.5초 후 자동 회전 재시작
    });
    
    // 터치 이벤트 지원 (마우스 이벤트와 동일한 로직)
    listWrapper.addEventListener('touchstart', function(e) {
        if (state.isRotating) return; // 회전 중일 때는 드래그 방지
        
        isDragging = true;
        startX = e.touches[0].clientX;
        startIndex = state.activeIndex;
        
        listWrapper.style.transition = 'none';
        
        stopAutoRotate();
        
        e.preventDefault();
    });
    
    window.addEventListener('touchmove', function(e) {
        if (!isDragging || state.isRotating) return;
        
        const deltaX = e.touches[0].clientX - startX;
        
        const dragThreshold = 100;
        const potentialIndex = startIndex + Math.round(deltaX / dragThreshold);
        const newIndex = Math.max(0, Math.min(totalItems - 1, potentialIndex));
        
        if (newIndex !== state.activeIndex) {
            setActiveItem(newIndex);
        }
    });
    
    window.addEventListener('touchend', function() {
        if (!isDragging || state.isRotating) return;
        isDragging = false;
        
        // 터치 종료 후 자동 회전 재개
        setTimeout(() => {
            if (!state.isRotating) {
                startAutoRotate();
            }
        }, 1500);
    });
    
    // 페이지 언로드 시 타이머 정리
    window.addEventListener('beforeunload', function() {
        stopAutoRotate();
    });
    
    // 전역 함수로 노출해서 외부에서 호출 가능하게 함
    window.updateRotatingCategory = function(index, fromSync = false) {
        // fromSync 매개변수 추가해서 무한 루프 방지
        if (!fromSync) {
            setActiveItem(index);
        } else {
            // 동기화 호출에서는 rotationDirection을 변경하지 않고 인덱스만 업데이트
            if (state.activeIndex !== index) {
                // 회전 없이 인덱스만 바로 업데이트
                state.activeIndex = index;
                
                // UI 업데이트
                categoryItems.forEach(item => item.classList.remove('active'));
                categoryItems[index].classList.add('active');
                
                // 콘텐츠 업데이트
                contentItems.forEach(content => {
                    if(content) content.style.display = 'none';
                });
                
                if(contentItems[index]) contentItems[index].style.display = 'flex';
                
                // 포지션 재계산
                positionItems();
            }
        }
    };
    
    // 초기 설정
    positionItems();
    setActiveItem(state.activeIndex);
    
    // 자동 회전 시작
    startAutoRotate();
    
    console.log("회전 카테고리 초기화 완료");
}

// 문서 로드 후 초기화 함수 호출
document.addEventListener('DOMContentLoaded', function() {
    console.log('문서 로드 완료, 회전 카테고리 초기화 시작');
    initRotatingCategories();
});

// 3D 장면 초기화 함수
function initThreeJsScene() {
    if (typeof THREE === 'undefined') {
        console.error('THREE.js가 로드되지 않았습니다.');
        return;
    }

    // 컨테이너 요소 가져오기
    const container = document.getElementById('greenappleViewContainer');
    if (!container) {
        console.error('greenappleViewContainer를 찾을 수 없습니다.');
        return;
    }

    // Three.js 변수 초기화
    let scene, camera, renderer, controls, light;
    
    // 메뉴 관련 변수
    const menuItems = [
        '.main-about-nav',
        '.main-brand-nav',
        '.main-notice-nav',
        '.main-member-nav',
        '.main-contact-nav'
    ];
    const contentItems = [
        '.main-about-summary',
        '.main-brand-summary',
        '.main-notice-summary',
        '.main-member-summary',
        '.main-contact-summary'
    ];
    let currentMenuIndex = 0; // 기본적으로 ABOUT이 활성화되도록 설정
    
    // 회전 각도 관련 변수
    let lastRotationY = 0;
    const rotationThreshold = 0.5; // 메뉴 전환을 위한 최소 회전 각도 (더 큰 값으로 설정하여 천천히 변환)

    // 씬 생성
    scene = new THREE.Scene();
    scene.background = new THREE.Color('black');

    // 컨테이너 크기 가져오기
    const width = container.clientWidth;
    const height = container.clientHeight;

    // 카메라 설정
    camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.z = 5;

    // 렌더러 설정
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    
    try {
        renderer.outputEncoding = THREE.sRGBEncoding;
    } catch (e) {
        console.warn('sRGBEncoding 설정 오류:', e);
    }
    
    container.appendChild(renderer.domElement);

    // 조명 추가
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(0, 10, 10);
    scene.add(light);

    // 메뉴 활성화 함수 - 전역 함수로 노출하여 회전 카테고리에서도 호출 가능하게 함
    window.activateMenuItem = function(index, sync = true) {
        
        // 순환 구조 (무한 루프) 구현
        if (index < 0) index = menuItems.length - 1; // 처음 항목에서 왼쪽으로 가면 마지막 항목으로
        if (index >= menuItems.length) index = 0; // 마지막 항목에서 오른쪽으로 가면 처음 항목으로
        
        // 현재 활성화된 메뉴 항목이 이미 선택된 경우 중복 처리 방지
        if (currentMenuIndex === index) return;
        
        // 모든 메뉴 항목에서 활성 클래스 제거
        menuItems.forEach((selector) => {
            const element = document.querySelector(selector);
            if (element) element.classList.remove('active');
        });
        
        // 선택된 메뉴 항목에 활성 클래스 추가
        const selectedElement = document.querySelector(menuItems[index]);
        if (selectedElement) selectedElement.classList.add('active');
        
        // 모든 콘텐츠 항목 숨기기
        contentItems.forEach((selector) => {
            const element = document.querySelector(selector);
            if (element) element.style.display = 'none';
        });
        
        // 선택된 콘텐츠 항목 표시
        const selectedContent = document.querySelector(contentItems[index]);
        if (selectedContent) selectedContent.style.display = 'flex';
        
        currentMenuIndex = index;
        
        // 회전 카테고리와 동기화 (순환 참조 방지를 위해 sync 플래그 사용)
        if (sync && typeof window.updateRotatingCategory === 'function') {
            window.updateRotatingCategory(index, true); // fromSync 플래그 전달
        }
    };

    // 컨트롤 추가
    if (typeof THREE.OrbitControls !== 'undefined') {
        controls = new THREE.OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        
        // 컨트롤 제약 설정 (모든 회전 허용, 하지만 Y축 회전만 메뉴 변경에 영향)
        controls.enableRotate = true;
        // 수직 회전(상하 드래그)은 제한하지 않음
        
        // 드래그 시작 시 이벤트
        controls.addEventListener('start', function() {
            lastRotationY = controls.getAzimuthalAngle();
            // 드래그 시작 시 자동 회전 일시 중지
            controls.autoRotate = false;
        });
        
        // 드래그 종료 시 이벤트
        controls.addEventListener('end', function() {
            // 드래그 종료 후 자동 회전 다시 활성화
            setTimeout(() => {
                controls.autoRotate = true;
            }, 1000); // 1초 후 자동 회전 다시 시작
        });
        
        // 드래그 중 이벤트
        controls.addEventListener('change', function() {
            const currentRotationY = controls.getAzimuthalAngle();
            const rotationDelta = currentRotationY - lastRotationY;
            
            // 회전 방향에 따라 메뉴 전환 (누적 회전으로 변경)
            if (Math.abs(rotationDelta) > rotationThreshold) {
                // 간단하게 다음/이전으로만 이동하는 방식으로 처리
                const newIndex = rotationDelta < 0 ? 
                    (currentMenuIndex + 1) % menuItems.length : 
                    (currentMenuIndex - 1 + menuItems.length) % menuItems.length;
                
                window.activateMenuItem(newIndex, true);
                
                // 회전 임계값을 넘으면 마지막 회전 위치 업데이트 
                lastRotationY = currentRotationY;
            }
        });
    } else {
        console.warn('OrbitControls를 사용할 수 없습니다.');
    }

    // 애니메이션 함수
    function animate() {
        requestAnimationFrame(animate);
        
        if (controls) controls.update();
        renderer.render(scene, camera);
    }

    // GLTF 모델 로드
    if (typeof THREE.GLTFLoader !== 'undefined') {
        const loader = new THREE.GLTFLoader();
        loader.load(
            '../source/threed/greenapple/greenapple.gltf',
            function (gltf) {
                console.log('모델 로드 성공!');
                
                // 모델 추가
                scene.add(gltf.scene);
                
                // 모델 크기 및 위치 조정
                const box = new THREE.Box3().setFromObject(gltf.scene);
                const center = box.getCenter(new THREE.Vector3());
                const size = box.getSize(new THREE.Vector3());
                
                // 모델 크기에 따라 카메라 위치 조정
                const maxDim = Math.max(size.x, size.y, size.z);
                const fov = camera.fov * (Math.PI / 180);
                let cameraZ = Math.abs(maxDim / Math.sin(fov / 2));
                
                // 모델 중앙으로 오프셋 적용
                gltf.scene.position.x = -center.x;
                gltf.scene.position.y = -center.y;
                gltf.scene.position.z = -center.z;
                
                // 카메라를 45도 각도로 배치
                camera.position.z = cameraZ * 0.5;
                camera.position.x = cameraZ * 0.5;
                camera.position.y = cameraZ * 0.5;
                camera.lookAt(0, 0, 0);
                
                // 카메라 업데이트
                const minZ = box.min.z;
                const cameraToFarEdge = minZ < 0 ? -minZ + cameraZ : cameraZ - minZ;
                
                camera.far = cameraToFarEdge * 3;
                camera.updateProjectionMatrix();
                
                // 조명 위치 조정
                light.position.set(center.x, center.y, center.z + cameraZ);
                
                // 초기 메뉴 항목 활성화
                window.activateMenuItem(1);
                
                // 자동 회전 활성화
                if (controls) {
                    controls.autoRotate = true;
                    controls.autoRotateSpeed = 2.0; // 회전 속도 설정 (기본값: 2.0)
                }
            },
            function (xhr) {
                console.log((xhr.loaded / xhr.total * 100) + '% 로드됨');
            },
            function (error) {
                console.error('모델 로드 오류:', error);
            }
        );
    } else {
        console.error('GLTFLoader를 사용할 수 없습니다.');
        animate();
    }

    // 창 크기 변경 이벤트 리스너
    window.addEventListener('resize', function() {
        const width = container.clientWidth;
        const height = container.clientHeight;
        
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
    });
    
    // 초기 애니메이션 시작
    animate();
    
    console.log('3D 장면 초기화 완료');
}

// CSS 스타일 추가
function addRotatingStyles() {
    const styleId = 'rotating-category-styles';
    if (document.getElementById(styleId)) return;
    
    const style = document.createElement('style');
    style.id = styleId;
    style.innerHTML = `
        /* 3D 회전 카테고리 CSS */
        #mainCategorySectionInner {
            max-width: 340px;
            margin: 0 auto;
            position: relative;
            perspective: 1000px; /* 3D 원근감 설정 */
        }

        /* 카테고리 래퍼 스타일 */
        #mainCategorySectionInner .main-category-list-wrapper {
            width: 100%;
            position: absolute;
            bottom: 50px;
            height: 40px;
            transform-style: preserve-3d; /* 3D 변환 스타일 유지 */
            transition: transform 0.5s ease-out; /* 부드러운 회전 애니메이션 */
            transform-origin: center center; /* 중앙을 기준으로 회전 */
        }

        /* 개별 카테고리 스타일 */
        #mainCategorySectionInner .main-category-list {
            position: absolute;
            width: 100px;
            height: 30px;
            left: 50%;
            margin-left: -50px; /* 가로 중앙 정렬 */
            backface-visibility: hidden; /* 뒷면 숨김 */
            transition: all 0.3s ease;
            text-align: center;
            cursor: pointer;
        }

        /* 모든 카테고리에 3D 위치 지정 */
        #mainCategorySectionInner .main-category-list:nth-child(1) { transform: rotateY(-144deg) translateZ(150px); } /* ABOUT */
        #mainCategorySectionInner .main-category-list:nth-child(2) { transform: rotateY(-72deg) translateZ(150px); } /* BRAND */
        #mainCategorySectionInner .main-category-list:nth-child(3) { transform: rotateY(0deg) translateZ(150px); } /* NOTICE */
        #mainCategorySectionInner .main-category-list:nth-child(4) { transform: rotateY(72deg) translateZ(150px); } /* MEMBER */
        #mainCategorySectionInner .main-category-list:nth-child(5) { transform: rotateY(144deg) translateZ(150px); } /* CONTACT */

        /* 카테고리 링크 스타일 */
        #mainCategorySectionInner .main-category-list a {
            font-family: 'esamanru';
            font-size: 14px;
            font-weight: 800;
            color: #fff;
            text-decoration: none;
            display: block;
            padding: 5px;
            transition: color 0.3s ease, text-shadow 0.3s ease, transform 0.3s ease;
            white-space: nowrap;
        }

        /* Active 상태 스타일 */
        #mainCategorySectionInner .main-category-list.active a {
            color: #00ff00;
            font-size: 18px; /* Active 상태에서 약간 크게 */
            text-shadow: 0 0 10px rgba(0, 255, 0, 0.5); /* 글로우 효과 */
        }

        /* 비활성 상태 스타일 - 원근감에 따라 투명도 조절 */
        #mainCategorySectionInner .main-category-list:not(.active) a {
            opacity: 0.8;
            transform: scale(0.9);
        }

        /* 모바일 대응 */
        @media (max-width: 870px) {
            #mainCategorySectionInner .main-category-content-wrapper {
                bottom: 90px;
                left: 0;
            }
            
            /* 모바일에서는 원근감 축소 */
            #mainCategorySectionInner .main-category-list-wrapper {
                height: 60px;
            }
            
            #mainCategorySectionInner .main-category-list {
                width: 80px;
                margin-left: -40px;
            }
            
            /* 모바일에서 각 항목 간격 조정 */
            #mainCategorySectionInner .main-category-list:nth-child(1) { transform: rotateY(-144deg) translateZ(120px); }
            #mainCategorySectionInner .main-category-list:nth-child(2) { transform: rotateY(-72deg) translateZ(120px); }
            #mainCategorySectionInner .main-category-list:nth-child(3) { transform: rotateY(0deg) translateZ(120px); }
            #mainCategorySectionInner .main-category-list:nth-child(4) { transform: rotateY(72deg) translateZ(120px); }
            #mainCategorySectionInner .main-category-list:nth-child(5) { transform: rotateY(144deg) translateZ(120px); }
        }
    `;
    document.head.appendChild(style);
    
    console.log('회전 카테고리 스타일 추가 완료');
}

// 컨테이너 요소를 주기적으로 확인하는 함수
function checkForContainer() {
    const container = document.getElementById('greenappleViewContainer');
    const categoryContainer = document.querySelector('.main-category-list-wrapper');
    
    // 3D 뷰어 컨테이너 또는 카테고리 컨테이너가 있으면 초기화 시작
    if (container || categoryContainer) {
        console.log('컨테이너를 찾았습니다!');
        clearInterval(checkInterval);
        
        // 회전 카테고리 스타일 추가
        addRotatingStyles();
        
        // 라이브러리 로드 및 초기화
        loadRequiredLibraries();
    } else {
        console.log('컨테이너 확인 중...');
    }
}

// 100ms마다 컨테이너 확인
const checkInterval = setInterval(checkForContainer, 100);

// 타임아웃 설정 (30초 후 중지)
setTimeout(() => {
    clearInterval(checkInterval);
    console.warn('컨테이너 확인 타임아웃');
}, 30000);