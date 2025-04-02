// codlingMoth 움직임 제어 개선 스크립트
document.addEventListener('DOMContentLoaded', function() {
    // 이미지 요소 찾기
    const moth = document.getElementById('codlingMothGif');
    
    // 이미지 요소가 없으면 함수 종료
    if (!moth) {
        console.error('codlingMothGif 요소를 찾을 수 없습니다.');
        return;
    }
    
    // 이미지가 로드될 때까지 기다리기
    function setupMoth() {
        console.log('나방 설정 시작');
        
        // 초기 설정
        let position = {
            x: Math.random() * (window.innerWidth - moth.width),
            y: Math.random() * (window.innerHeight - moth.height)
        };
        
        // 속도 벡터 (처음에는 항상 우측으로 이동, 속도 절반으로 감소)
        let velocity = {
            x: 1.5 + Math.random(),  // 항상 우측으로 이동 (1.5~2.5 사이 속도)
            y: Math.random() > 0.5 ? 1 : -1   // 위 또는 아래로 이동은 랜덤, 속도 절반
        };
        
        // 이미지 좌우 반전 상태 (기본은 정방향)
        let flippedHorizontally = false;
        
        // moth의 초기 위치 및 스타일 설정
        moth.style.position = 'fixed'; // absolute 대신 fixed 사용하여 스크롤과 무관하게 설정
        moth.style.left = position.x + 'px';
        moth.style.top = position.y + 'px';
        moth.style.zIndex = '1000'; // 다른 요소 위에 표시
        moth.style.transition = 'transform 0.1s ease-out'; // 부드러운 뒤집기 효과
        
        // 디버그용 로그
        console.log('초기 위치:', position);
        console.log('이미지 크기:', moth.width, 'x', moth.height);
        
        // 경계 설정 - 화면의 실제 표시 영역
        function getBoundaries() {
            // 실제 화면 표시 영역 사용 (fixed positioning에 맞춰서)
            return {
                left: 0,
                right: window.innerWidth - moth.width,
                top: 0, 
                bottom: window.innerHeight - moth.height
            };
        }
        
        let boundaries = getBoundaries();
        console.log('계산된 경계:', boundaries);
        
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
            } 
            // 아래쪽 경계 확인
            else if (nextY >= boundaries.bottom) {
                // 경계에 정확히 닿도록 조정
                position.y = boundaries.bottom;
                // 방향 반사 (이미지 반전 없음)
                velocity.y = -Math.abs(velocity.y);
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
                
                // 속도 범위 제한 (최소 0.5, 최대 2.5)
                // x축 속도 제한
                if (Math.abs(velocity.x) < 0.5) {
                    velocity.x = 0.5 * Math.sign(velocity.x) || 0.5; // 0인 경우 0.5로 설정
                } else if (Math.abs(velocity.x) > 2.5) {
                    velocity.x = 2.5 * Math.sign(velocity.x);
                }
                
                // y축 속도 제한
                if (Math.abs(velocity.y) < 0.5) {
                    velocity.y = 0.5 * Math.sign(velocity.y) || 0.5; // 0인 경우 0.5로 설정
                } else if (Math.abs(velocity.y) > 2.5) {
                    velocity.y = 2.5 * Math.sign(velocity.y);
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
            console.log('리사이즈 후 경계 재계산:', boundaries);
            
            // 이미지가 화면을 벗어났으면 조정
            if (position.x > boundaries.right) {
                position.x = boundaries.right;
            }
            if (position.y > boundaries.bottom) {
                position.y = boundaries.bottom;
            }
        });
    }
    
    // 이미지 로드 확인 및 설정
    function initMoth() {
        // 이미지 로드 체크
        if (moth.complete) {
            console.log('이미지가 이미 로드됨');
            setupMoth();
        } else {
            console.log('이미지 로드 대기 중...');
            // 이미지가 로드되면 설정 시작
            moth.onload = setupMoth;
            
            // 이미지 로드 실패 시 대비
            moth.onerror = function() {
                console.error('이미지 로드 실패');
            };
            
            // 안전장치: 5초 후에도 로드가 안 되면 강제로 설정 시작
            setTimeout(function() {
                if (!moth.complete) {
                    console.warn('이미지 로드 타임아웃, 강제 설정 시작');
                    setupMoth();
                }
            }, 5000);
        }
    }
    
    // 초기화 시작
    initMoth();
});