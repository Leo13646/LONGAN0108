body {
  font-family: "Noto Sans TC", sans-serif;
  background-color: #1c1c1c;
  color: #f5f5f5;
  margin: 0;
  padding: 2rem;
}

h1 {
  font-size: 2rem;
  margin-bottom: 1rem;
}

.container {
  max-width: 720px;
  margin: auto;
  background-color: #2a2a2a;
  border-radius: 20px;
  box-shadow: 0 0 20px rgba(255, 255, 255, 0.1);
  padding: 2rem;
}

form {
  display: grid;
  gap: 1rem;
  margin-bottom: 2rem;
}

input, select, button {
  padding: 0.75rem;
  font-size: 1rem;
  border-radius: 10px;
  border: none;
  outline: none;
}

input, select {
  background-color: #333;
  color: #f5f5f5;
  border: 1px solid #555;
}

button {
  background-color: #000;
  color: white;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: all 0.3s;
}

button::before {
  content: "";
  position: absolute;
  top: 50%;
  left: 50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.2) 0%, transparent 70%);
  transform: translate(-50%, -50%) scale(0);
  transition: transform 0.3s ease-out;
}

button:hover::before {
  transform: translate(-50%, -50%) scale(1);
}

.history {
  margin-top: 2rem;
  border-top: 1px solid #444;
  padding-top: 1rem;
}

.history-item {
  display: flex;
  justify-content: space-between;
  padding: 0.5rem 0;
  border-bottom: 1px dashed #555;
}

.history-item.income {
  color: #3edc81;
}

.history-item.expense {
  color: #ff6b6b;
}

.net-profit {
  font-weight: bold;
  font-size: 1.5rem;
  text-align: center;
  margin: 1rem 0;
}

.net-profit.positive {
  color: #3edc81;
}

.net-profit.negative {
  color: #ff6b6b;
}
