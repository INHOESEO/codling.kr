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
        
        // 라이브러리 로드 후 초기화
        initThreeJsScene();
    } catch (error) {
        console.error('라이브러리 로드 중 오류 발생:', error);
    }
}

// 3D 장면 초기화 함수
function initThreeJsScene() {
    if (typeof THREE === 'undefined') {
        console.error('THREE.js가 로드되지 않았습니다.');
        return;
    }

    // 컨테이너 요소 가져오기
    const container = document.getElementById('greenappleViewContainer');
    if (!container) {
        console.error('컨테이너를 찾을 수 없습니다.');
        return;
    }

    // Three.js 변수 초기화
    let scene, camera, renderer, controls, light;
    
    // 메뉴 관련 변수
    const menuItems = [
        '.main-about-nav',
        '.main-brand-nav',
        '.main-notice-nav',
        '.main-recruit-nav',
        '.main-contact-nav'
    ];
    const contentItems = [
        '.main-about-summary',
        '.main-brand-summary',
        '.main-notice-summary',
        '.main-recruit-summary',
        '.main-contact-summary'
    ];
    let currentMenuIndex = 0; // 기본적으로 ABOUT이 활성화되도록 설정
    
    // 회전 각도 관련 변수
    let lastRotationY = 0;
    const rotationThreshold = 0.5; // 메뉴 전환을 위한 최소 회전 각도 (더 큰 값으로 설정하여 천천히 변환)
    
    // 자동 메뉴 변경 인터벌
    let autoMenuChangeInterval = null;

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

    // 메뉴 활성화 함수
    function activateMenuItem(index) {
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
    }

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
                // 오른쪽으로 드래그 (카메라가 왼쪽으로 회전)
                if (rotationDelta < 0) {
                    activateMenuItem(currentMenuIndex + 1);
                }
                // 왼쪽으로 드래그 (카메라가 오른쪽으로 회전)
                else if (rotationDelta > 0) {
                    activateMenuItem(currentMenuIndex - 1);
                }
                
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
                activateMenuItem(1);
                
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
    
    // CSS 추가 - 활성화된 메뉴 항목 스타일 및 콘텐츠 표시/숨김
    const style = document.createElement('style');
    style.innerHTML = `
        .main-category-list.active a {
            color: #00ff00 !important;
            font-weight: bold;
        }
        
        /* 초기에 모든 콘텐츠 숨기기 */
        .main-category-content {
            display: none;
        }
    `;
    document.head.appendChild(style);
    
    // 초기 애니메이션 시작
    animate();
}

// 컨테이너 요소를 주기적으로 확인하는 함수
function checkForContainer() {
    const container = document.getElementById('greenappleViewContainer');
    
    if (container) {
        console.log('greenappleViewContainer를 찾았습니다!');
        clearInterval(checkInterval);
        loadRequiredLibraries();
    } else {
        console.log('greenappleViewContainer 확인 중...');
    }
}

// 100ms마다 컨테이너 확인
const checkInterval = setInterval(checkForContainer, 100);

// 타임아웃 설정 (30초 후 중지)
setTimeout(() => {
    clearInterval(checkInterval);
    console.warn('greenappleViewContainer 확인 타임아웃');
}, 30000);