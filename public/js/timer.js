export function startCountdown(seconds, counterSelector, btnSelector, redirectUrl) {
  const counter = document.querySelector(counterSelector);
  const btn = document.querySelector(btnSelector);

  if (!counter || !btn) return;

  let time = seconds;
  counter.textContent = time;

  const interval = setInterval(() => {
    time--;
    counter.textContent = time;

    if (time <= 0) {
      clearInterval(interval);
      btn.style.display = "inline-block";
      btn.href = redirectUrl;
    }
  }, 1000);
}
