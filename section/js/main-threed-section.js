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

    // 테스트용 큐브 추가 (디버깅용)
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    const cube = new THREE.Mesh(geometry, material);
    scene.add(cube);

    // 조명 추가
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(0, 10, 10);
    scene.add(light);

    // 컨트롤 추가
    if (typeof THREE.OrbitControls !== 'undefined') {
        controls = new THREE.OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
    } else {
        console.warn('OrbitControls를 사용할 수 없습니다.');
    }

    // 애니메이션 함수
    function animate() {
        requestAnimationFrame(animate);
        
        // 큐브 회전 (디버깅용)
        cube.rotation.x += 0.01;
        cube.rotation.y += 0.01;
        
        if (controls) controls.update();
        renderer.render(scene, camera);
    }

    // GLTF 모델 로드 시도
    if (typeof THREE.GLTFLoader !== 'undefined') {
        const loader = new THREE.GLTFLoader();
        loader.load(
            '../source/threed/greenapple/greenapple.gltf',
            function (gltf) {
                console.log('모델 로드 성공!');
                
                // 테스트 큐브 제거
                scene.remove(cube);
                
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
                
                camera.position.z = cameraZ * 1.5;
                
                // 카메라 업데이트
                const minZ = box.min.z;
                const cameraToFarEdge = minZ < 0 ? -minZ + cameraZ : cameraZ - minZ;
                
                camera.far = cameraToFarEdge * 3;
                camera.updateProjectionMatrix();
                
                // 조명 위치 조정
                light.position.set(center.x, center.y, center.z + cameraZ);
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
        // 그래도 애니메이션은 실행 (큐브라도 보여주기 위해)
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