// ===== 天气时钟配置 =====
const GAODE_KEY = '0dda39b913c9010b8df976e7c0abc333';
//const WEATHER_KEY = 'feecb5967c8b4220a1e2cc9bda8deb00';
const DEFAULT_CITY = '烟台';

// 等待侧边栏加载
document.addEventListener('DOMContentLoaded', function() {
  setTimeout(function() {
    const sidebar = document.querySelector('.sticky_layout');
    if (!sidebar || document.getElementById('custom-clock')) return;
    
    // 插入时钟骨架
    sidebar.insertAdjacentHTML('afterbegin', `
      <div id="custom-clock" class="card-widget" style="margin-bottom: 20px; background: var(--card-bg); border-radius: 16px; padding: 18px 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
        <div style="text-align: center; color: #49B1F5; margin-bottom: 10px; font-size: 14px;" id="clock-loading">
          <span>⏳ 定位中...</span>
        </div>
        <div style="text-align: center; margin-bottom: 8px;">
          <span style="font-size: 16px; font-weight: 600; color: #49B1F5;" id="cDate">2026-02-14 SAT</span>
        </div>
        <div style="display: flex; justify-content: center; align-items: center; gap: 20px; margin-bottom: 8px;">
          <span style="font-size: 26px; font-weight: 700; color: #F47466;" id="cTemp">--°C</span>
          <span style="font-size: 22px; color: #49B1F5;" id="cHumidity">💧 --%</span>
        </div>
        <div style="text-align: center; margin: 12px 0 15px 0;">
          <span style="font-size: 48px; font-weight: 700; color: #49B1F5; font-family: 'Courier New', monospace; letter-spacing: 4px;" id="cTime">18:47:52</span>
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 5px; padding-top: 12px; border-top: 1px solid rgba(73,177,245,0.2);">
          <span style="font-size: 14px; color: #858585; display: flex; align-items: center; gap: 3px;" id="cWind">🌪️ --</span>
          <span style="font-size: 14px; font-weight: 500; color: #49B1F5; display: flex; align-items: center; gap: 3px;" id="cLocation">📍 --</span>
          <span style="font-size: 13px; background: rgba(73,177,245,0.1); padding: 4px 10px; border-radius: 20px; color: #F47466; font-weight: 500;" id="cAir">PM2.5 --</span>
        </div>
      </div>
    `);
    
    // ===== 更新时间 =====
    function updateTime() {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const weekdays = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
      const weekday = weekdays[now.getDay()];
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');
      
      document.getElementById('cDate') && (document.getElementById('cDate').textContent = `${year}-${month}-${day} ${weekday}`);
      document.getElementById('cTime') && (document.getElementById('cTime').textContent = `${hours}:${minutes}:${seconds}`);
    }
    updateTime();
    setInterval(updateTime, 1000);
    
    // ===== 获取天气 =====
    async function getWeather() {
      try {
        document.getElementById('clock-loading') && (document.getElementById('clock-loading').innerHTML = '⏳ 获取位置中...');
        
        // 1. 高德地图IP定位
        const ipResponse = await fetch(`https://restapi.amap.com/v3/ip?key=${GAODE_KEY}`);
        const ipData = await ipResponse.json();
        
        // 打印返回的数据，看看高德到底返回了什么
        console.log('高德地图返回:', ipData);
        
        let city = DEFAULT_CITY;
        
        // 更智能的城市解析
        if (ipData.status === '1' && ipData.city) {
          // 处理各种可能的数据类型
          let rawCity = ipData.city;
          console.log('原始城市数据:', rawCity, '类型:', typeof rawCity);
          
          // 如果是数组，取第一个
          if (Array.isArray(rawCity)) {
            rawCity = rawCity[0] || '';
          }
          
          // 转换成字符串并清理
          if (rawCity) {
            city = String(rawCity).replace(/[市省]/g, '').trim();
            if (!city) city = DEFAULT_CITY;
          }
          
          console.log('解析后的城市:', city);
          document.getElementById('clock-loading') && (document.getElementById('clock-loading').innerHTML = '⏳ 获取天气中...');
        } else {
          console.log('高德定位失败，使用默认城市:', DEFAULT_CITY);
        }
        
        // ===== 重点修改部分：通过后端代理获取天气 =====
        // 使用相对路径，自动适配当前域名
        const weatherUrl = `/api/weather?city=${encodeURIComponent(city)}`;
        console.log('请求天气(通过代理):', weatherUrl);
        
        const weatherResponse = await fetch(weatherUrl);
        const weatherData = await weatherResponse.json();
        
        console.log('天气返回:', weatherData);
        
        if (weatherData.code === '200') {
          const now = weatherData.now;
          
          document.getElementById('cTemp').textContent = `${now.temp}°C`;
          document.getElementById('cHumidity').innerHTML = `💧 ${now.humidity}%`;
          document.getElementById('cWind').innerHTML = `🌪️ ${now.windDir} ${now.windScale}级`;
          document.getElementById('cLocation').innerHTML = `📍 ${city}`;
          
          // ===== 空气质量也通过代理获取 =====
          const airUrl = `/api/air?city=${encodeURIComponent(city)}`;
          const airResponse = await fetch(airUrl);
          const airData = await airResponse.json();
          
          if (airData.code === '200') {
            document.getElementById('cAir').innerHTML = `PM2.5 ${airData.now.pm2p5}`;
          }
          
          document.getElementById('clock-loading') && (document.getElementById('clock-loading').style.display = 'none');
        } else {
          // 如果出错，使用默认数据
          throw new Error('天气获取失败: ' + weatherData.code);
        }
        
      } catch (error) {
        console.error('天气获取失败:', error);
        document.getElementById('clock-loading') && (document.getElementById('clock-loading').innerHTML = '⚠️ 使用默认数据');
        
        // 使用默认数据
        document.getElementById('cTemp').textContent = '22°C';
        document.getElementById('cHumidity').innerHTML = '💧 60%';
        document.getElementById('cWind').innerHTML = '🌪️ 东北风 2级';
        document.getElementById('cLocation').innerHTML = '📍 烟台';
        document.getElementById('cAir').innerHTML = 'PM2.5 35';
      }
    }
    
    // 立即获取天气
    getWeather();
    // 每30分钟更新
    setInterval(getWeather, 30 * 60 * 1000);
    
  }, 100);
});