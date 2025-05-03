<!DOCTYPE html>
<html lang="zh-Hant">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>財務報表</title>
  <link rel="stylesheet" href="style.css">
  <script type="module" src="script.js" defer></script>
</head>
<body>
  <header class="hero">
    <h1>財務報表</h1>
    <p class="motto">創業，就是在別人懷疑你時，你還敢繼續相信自己。</p>
  </header>

  <main class="container">
    <form id="entryForm">
      <select id="type">
        <option value="income">收入</option>
        <option value="sellCost">銷售支出</option>
        <option value="prCost">公關贈送</option>
        <option value="kolCost">KOL 分潤</option>
        <option value="opsCost">營運支出</option>
      </select>
      <input type="number" id="amount" placeholder="金額" required>
      <button type="submit">新增一筆</button>
    </form>

    <section class="summary">
      <p>總資本：<span id="capital">0</span></p>
      <p>總清別：<span id="netProfit">0</span></p>
    </section>

    <section class="charts">
      <canvas id="pie"></canvas>
      <canvas id="line"></canvas>
    </section>

    <section class="history">
      <h2>歷史紀錄</h2>
      <ul id="historyList"></ul>
    </section>
  </main>
</body>
</html>
