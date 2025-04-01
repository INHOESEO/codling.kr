// codlingMoth 움직임 제어 스크립트
document.addEventListener('DOMContentLoaded', function() {
    const moth = document.getElementById('codlingMothGif');
    
    // 이미지가 로드될 때까지 기다리기
    function setupMoth() {
        // 초기 설정
        let position = {
            x: Math.random() * (window.innerWidth - moth.width),
            y: Math.random() * (window.innerHeight - moth.height)
        };
        
        // 속도 벡터 (명확한 속도로 설정)
        let velocity = {
            x: Math.random() > 0.5 ? 3 : -3,  // 왼쪽 또는 오른쪽으로 이동
            y: Math.random() > 0.5 ? 2 : -2   // 위 또는 아래로 이동
        };
        
        // 이미지 좌우 반전 상태 (기본은 정방향)
        let flippedHorizontally = false;
        
        // moth의 초기 위치 및 스타일 설정
        moth.style.position = 'absolute';
        moth.style.left = position.x + 'px';
        moth.style.top = position.y + 'px';
        moth.style.zIndex = '1000'; // 다른 요소 위에 표시
        moth.style.transition = 'transform 0.1s ease-out'; // 부드러운 뒤집기 효과
        
        // 경계 설정 - 정확히 화면 가장자리
        function getBoundaries() {
            return {
                left: 0,
                right: window.innerWidth - moth.width,
                top: 0,
                bottom: window.innerHeight - moth.height
            };
        }
        
        let boundaries = getBoundaries();
        
        // 이미지 반전 적용 함수
        function applyTransform() {
            moth.style.transform = flippedHorizontally ? 'scaleX(-1)' : '';
        }
        
        // 애니메이션 함수
        function animate() {
            // 다음 위치 계산
            let nextX = position.x + velocity.x;
            let nextY = position.y + velocity.y;
            
            // 왼쪽 경계 확인
            if (nextX <= boundaries.left) {
                // 경계에 정확히 닿도록 조정
                position.x = boundaries.left;
                // 방향 반사
                velocity.x = Math.abs(velocity.x);
                // 이미지 좌우 반전
                flippedHorizontally = !flippedHorizontally;
                applyTransform();
                console.log("왼쪽 가장자리 대칭 이동 - 이미지 좌우 반전");
            } 
            // 오른쪽 경계 확인
            else if (nextX >= boundaries.right) {
                // 경계에 정확히 닿도록 조정
                position.x = boundaries.right;
                // 방향 반사
                velocity.x = -Math.abs(velocity.x);
                // 이미지 좌우 반전
                flippedHorizontally = !flippedHorizontally;
                applyTransform();
                console.log("오른쪽 가장자리 대칭 이동 - 이미지 좌우 반전");
            } 
            else {
                // 경계 내부라면 다음 위치로 이동
                position.x = nextX;
            }
            
            // 위쪽 경계 확인
            if (nextY <= boundaries.top) {
                // 경계에 정확히 닿도록 조정
                position.y = boundaries.top;
                // 방향 반사 (이미지 반전 없음)
                velocity.y = Math.abs(velocity.y);
                console.log("위쪽 가장자리 대칭 이동 - 방향만 변경");
            } 
            // 아래쪽 경계 확인
            else if (nextY >= boundaries.bottom) {
                // 경계에 정확히 닿도록 조정
                position.y = boundaries.bottom;
                // 방향 반사 (이미지 반전 없음)
                velocity.y = -Math.abs(velocity.y);
                console.log("아래쪽 가장자리 대칭 이동 - 방향만 변경");
            } 
            else {
                // 경계 내부라면 다음 위치로 이동
                position.y = nextY;
            }
            
            // 가끔 랜덤으로 방향 변경 (자연스러운 움직임을 위해)
            if (Math.random() < 0.01) { // 1% 확률
                // 속도 변화를 더 작게 조정
                velocity.x += (Math.random() * 0.6) - 0.3;
                velocity.y += (Math.random() * 0.6) - 0.3;
                
                // 속도 범위 제한 (최소 1, 최대 5)
                // x축 속도 제한
                if (Math.abs(velocity.x) < 1) {
                    velocity.x = 1 * Math.sign(velocity.x) || 1; // 0인 경우 1로 설정
                } else if (Math.abs(velocity.x) > 5) {
                    velocity.x = 5 * Math.sign(velocity.x);
                }
                
                // y축 속도 제한
                if (Math.abs(velocity.y) < 1) {
                    velocity.y = 1 * Math.sign(velocity.y) || 1; // 0인 경우 1로 설정
                } else if (Math.abs(velocity.y) > 5) {
                    velocity.y = 5 * Math.sign(velocity.y);
                }
            }
            
            // moth 위치 업데이트
            moth.style.left = position.x + 'px';
            moth.style.top = position.y + 'px';
            
            // 다음 프레임 요청
            requestAnimationFrame(animate);
        }
        
        // 애니메이션 시작
        animate();
        
        // 화면 크기 변경 시 이벤트 처리
        window.addEventListener('resize', function() {
            // 경계 다시 계산
            boundaries = getBoundaries();
            
            // 이미지가 화면을 벗어났으면 조정
            if (position.x > boundaries.right) {
                position.x = boundaries.right;
            }
            if (position.y > boundaries.bottom) {
                position.y = boundaries.bottom;
            }
        });
    }
    
    // 이미지가 이미 로드되었는지 확인
    if (moth.complete) {
        setupMoth();
    } else {
        moth.onload = setupMoth;
    }
});