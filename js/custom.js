// 文章过期提醒关闭功能
(function() {
    'use strict';
    
    function initNoticeOutdate() {
        const notices = document.querySelectorAll('.notice-outdate');
        
        if (notices.length === 0) return;
        
        notices.forEach(function(notice) {
            // 检查是否已隐藏
            const articleId = notice.dataset.articleId || 
                             window.location.pathname + 
                             (notice.dataset.index || '');
            
            try {
                const hideUntil = localStorage.getItem('hide_notice_' + articleId);
                if (hideUntil && new Date(hideUntil) > new Date()) {
                    notice.style.display = 'none';
                    return;
                }
            } catch (e) {
                console.warn('LocalStorage 访问失败:', e);
            }
            
            // 添加关闭按钮
            if (!notice.querySelector('.close-btn')) {
                const closeBtn = document.createElement('button');
                closeBtn.className = 'close-btn';
                closeBtn.innerHTML = '×';
                closeBtn.setAttribute('aria-label', '关闭提醒');
                closeBtn.setAttribute('title', '关闭提醒');
                
                closeBtn.addEventListener('click', function() {
                    notice.style.opacity = '0';
                    notice.style.transform = 'translateY(-10px)';
                    
                    setTimeout(function() {
                        notice.style.display = 'none';
                        
                        // 保存到 localStorage
                        try {
                            const expiry = new Date();
                            expiry.setDate(expiry.getDate() + 7);
                            localStorage.setItem('hide_notice_' + articleId, expiry.toISOString());
                        } catch (e) {
                            console.warn('无法保存到 localStorage:', e);
                        }
                    }, 300);
                });
                
                notice.appendChild(closeBtn);
            }
        });
    }
    
    // 页面加载完成后执行
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initNoticeOutdate);
    } else {
        initNoticeOutdate();
    }
})();

