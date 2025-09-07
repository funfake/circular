# Circular

**Closing the loop from tasks to delivery.**  
Circular is an AI-driven agent that connects Jira and GitHub to fully automate the path from task creation to code delivery.

---

## 🚀 Features

- Automatically fetches tasks from **Jira**
- Understands task requirements and context
- Generates and tests code changes in a sandbox
- Opens Pull Requests in **GitHub**
- Updates Jira task status to **Done ✅**
- Creates a complete automation loop: **Task → PR → Done**

---

## 🛠 Initial Configuration

To get started, the IT team needs to:

1. Add our GitHub bot (`Circular-bot`) to the company account  
2. Provide a Jira access key  
3. Configure GitHub & Jira project repositories  

Once this one-time setup is done, Circular runs automatically.

---

## 🎯 Qualifying Tickets

Circular is designed to handle tasks that are:

- **Well-defined** → clear description of expected changes  
- **Atomic** → small and focused (e.g., bug fix, function update)  
- **Code-related** → bug fixes, small features, config changes  
- **Testable** → tasks with clear success criteria  

---

## 🚫 Non-Qualifying Tickets

Circular is **not** designed for:

- Large epics or undefined multi-sprint work  
- Ambiguous requirements without acceptance criteria  
- Non-code tasks (design, documentation, meetings)  
- High-risk changes (core business logic, database migrations, production-critical systems)  

---

## 📸 Demo

[Insert screenshots or GIFs here]  
- Jira → New Task  
- Circular Dashboard → Task picked up  
- GitHub → Auto-generated PR  
- Jira → Status updated to Done  

---

## 🔮 Vision

Future improvements:

- Automated testing & deployment  
- Support for more platforms (Trello, Asana, ClickUp)  
- Complex task decomposition with multi-agent collaboration  

---

## 👥 Team

William · Kevin · Juan Carlos · Yingbo

---

## 📜 License

This project was created during [BLACKBOX.AI x 42AI Agents Hackathon] 2025. 

---

## ⚙️ Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)  
- npm or yarn package manager  

### Run Locally

```bash
# 1. Clone the repo
git clone https://github.com/funfake/circular.git
cd circular

# 2. Install dependencies
yarn install

# 3. Run the development server
yarn dev

# 4. Open in browser
http://localhost:3000 
