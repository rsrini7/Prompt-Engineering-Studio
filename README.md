# Prompt Engineering Studio 🚀

An open-source IDE for designing, analyzing, and optimizing LLM prompts. This tool provides real-time feedback and powerful automation to help developers and researchers create more effective prompts.


### 🚀 Prompt Optimization Interface
*Advanced DSPy optimization with before/after comparison*

![Optimize Screenshot](assets/optimize-screenshot.png)

### 📝 Pattern Analysis View
*Real-time pattern detection and template suggestions*

![Prompt1 Screenshot](assets/prompt1-screenshot.png)

### 🎨 Main Application Interface
*Complete prompt engineering workflow with analysis panel*

![Prompt2 Screenshot](assets/prompt2-screenshot.png)

---

## ✨ Key Features

* **Real-time Pattern Analysis:** Instantly identifies common prompt engineering patterns (like Zero-Shot, Role Prompting, Chain-of-Thought) as you type.
* **LLM-as-a-Refiner:** Advanced pattern detection accuracy using LLM refinement for enhanced analysis precision (optional toggle).
* **Advanced DSPy Metrics:** Support for both exact match and LLM-as-a-Judge (qualitative) optimization metrics.
* **Cost Estimation & Guardrails:** Real-time cost estimation with configurable iteration limits and cost control features.
* **Intelligent Template Merging:** Automatically populate LangChain Hub templates with content from user prompts using LLM intelligence.
* **Intelligent Template Suggestions:** Recommends relevant prompt templates from LangChain Hub based on the detected patterns in your prompt.
* **UI-Based Dataset Builder:** Create datasets directly in the application with an intuitive modal interface - no CSV files needed.
* **Export Options:** Export optimized prompts as JSON with metadata or as ready-to-use Python scripts with usage examples.
* **Automated Prompt Optimization:** Uses **DSPy** to automatically optimize your prompts by generating few-shot examples from a small dataset you provide.
* **Modern UI:** A clean, responsive, dark-themed interface built for an efficient and pleasant workflow.

---

## 🛠️ Tech Stack

| Frontend                | Backend                          |
| ----------------------- | -------------------------------- |
| **React** | **Python 3.10+** |
| **TypeScript** | **FastAPI** |
| **Vite** | **DSPy** (`dspy-ai`)             |
| **Axios** | **LangChain** |
| **CSS Modules** | **Ollama** (for local LLM hosting) |
|                         | **Uvicorn** (ASGI Server)        |
|                         | **uv** (Package Manager)         |

---

## 🏁 Getting Started

Follow these instructions to set up and run the project on your local machine.

### Prerequisites

Make sure you have the following installed:
* **Node.js** (v18 or later)
* **Python** (v3.10 or later)
* **uv** (Python package manager): `pip install uv`
* **Ollama**: Download and install from [ollama.com](https://ollama.com/).
    * Pull a model to be used for optimization: `ollama run gemma:2b`

### Installation & Setup

1.  **Clone the repository:**
    ```sh
    git clone <your-repository-url>
    cd Prompt-Engineering-Studio
    ```

2.  **Configure Environment Variables:**
    ```powershell
    # Copy the example environment file
    cp .env .env.local

    # Edit .env.local with your actual API keys
    notepad .env.local
    ```

3.  **Set up the Backend:**
    ```powershell
    # Navigate to the backend directory
    cd backend

    # Create and activate the virtual environment
    uv venv
    .\.venv\Scripts\Activate.ps1

    # Install the required packages
    uv pip install fastapi uvicorn[standard] websockets python-dotenv dspy-ai pandas python-multipart

    # (Optional) Create a requirements.txt file
    uv pip freeze > requirements.txt
    ```

4.  **Set up the Frontend:**
    ```powershell
    # Navigate to the frontend directory from the root
    cd frontend

    # Install npm packages
    npm install
    ```

### Running the Application

You will need two separate terminals to run both the backend and frontend servers.

1.  **Run the Backend Server:**
    * In a terminal at the `backend` directory:
    * Make sure Ollama is running in the background.
    * Activate the virtual environment: `.\.venv\Scripts\Activate.ps1`
    * Start the server: `uvicorn app.main:app --reload`
    * The API will be available at `http://127.0.0.1:8000`

2.  **Run the Frontend Server:**
    * In another terminal at the `frontend` directory:
    * Start the development server: `npm run dev`
    * The UI will be available at `http://localhost:5173`

### API Key Configuration

The application supports multiple LLM providers and requires API keys for external services. Configure your API keys using environment variables:

#### Required API Keys

1. **LangSmith API Key** (for accessing LangChain Hub templates)
   - Get from: https://smith.langchain.com/settings
   - Environment variable: `LANGSMITH_API_KEY`

2. **Groq API Key** (for fast LLM inference)
   - Get from: https://console.groq.com/keys
   - Environment variable: `GROQ_API_KEY`

3. **OpenRouter API Key** (for accessing various LLM models)
   - Get from: https://openrouter.ai/keys
   - Environment variable: `OPENROUTER_API_KEY`

#### Setup Instructions

1. **Copy the environment file:**
   ```bash
   cp .env .env.local
   ```

2. **Edit with your API keys:**
   ```bash
   # Windows
   notepad .env.local

   # macOS/Linux
   nano .env.local
   ```

3. **Fill in your actual API keys:**
   ```env
   LANGSMITH_API_KEY=lsv2_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   OPENROUTER_API_KEY=sk-or-v1-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```

4. **Restart the backend server** to load the new environment variables.

#### Provider Requirements

- **Ollama**: No API key required (local inference)
- **OpenRouter/Groq**: API keys required for cloud inference
- **LangSmith**: API key required for accessing template hub

### Using LLM-as-a-Refiner

The application now includes an advanced LLM-as-a-Refiner feature for enhanced pattern detection accuracy:

1. **Enable the Feature:** In the Pattern Analysis panel, toggle "🤖 Use LLM Refiner"
2. **Configure LLM Provider:** Select your preferred provider (Ollama, OpenRouter, or Groq)
3. **Set Model:** Enter the model name (e.g., `gemma:2b` for Ollama)
4. **API Key Handling:** The system automatically uses environment variables or provided keys
5. **Enhanced Analysis:** The system will now use LLM refinement for improved pattern detection accuracy

**Note:** This feature requires a running LLM service (Ollama) or valid API credentials for cloud providers.

### Using Advanced DSPy Metrics

The application now supports both quantitative and qualitative prompt optimization:

1. **Select Optimization Metric:** In the "Optimize Prompt" panel, choose between:
   - **"Exact Match (Default)"** - Traditional string matching against ground truth
   - **"LLM-as-a-Judge (Quality Score)"** - AI-powered qualitative evaluation

2. **Configure LLM Provider:** Set up your preferred provider for the LLM judge evaluation

3. **Upload Dataset:** Provide a CSV/JSONL file with question-answer pairs for optimization

4. **Run Optimization:** The system will use your selected metric to optimize the prompt

**LLM-as-a-Judge Benefits:**
- Evaluates style, engagement, and clarity
- Provides human-like quality assessment
- Better for creative or subjective tasks
- More nuanced than exact string matching

**Use Cases:**
- **Exact Match**: Factual Q&A, technical content, precise instructions
- **LLM-as-a-Judge**: Creative writing, marketing copy, conversational AI, subjective content

### Using Cost Estimation & Guardrails

The application now includes responsible AI features for cost management and optimization control:

1. **Enable Cost Estimation:** Toggle "💰 Show Cost Estimation" in the Optimize Prompt panel

2. **Configure Guardrails:** Set maximum iterations (1-10) to control optimization intensity

3. **Review Cost Breakdown:** View detailed cost estimation including:
   - Token counts (input/output)
   - Provider-specific pricing
   - Total estimated cost
   - Example count and iteration details

4. **Cost Confirmation:** For significant costs (>$0.01), users are prompted for confirmation before proceeding

**Cost Management Benefits:**
- **Transparent Pricing:** Clear cost breakdown before optimization
- **Budget Control:** Set iteration limits to manage expenses
- **Provider Flexibility:** Automatic pricing for different LLM providers
- **Resource Awareness:** Make informed decisions about optimization intensity

**Guardrails Features:**
- **Iteration Control:** Limit optimization rounds (1-10 iterations)
- **Cost Thresholds:** Automatic confirmation for expensive operations
- **Provider Awareness:** Accurate pricing for Ollama, OpenRouter, and Groq
- **Real-time Updates:** Cost estimation updates as settings change

### Using Intelligent Template Merging

The application now includes AI-powered template population for seamless prompt engineering:

1. **Write Your Prompt:** Enter your prompt in the text area as usual

2. **Run Pattern Analysis:** Click "Analyze" to detect patterns and get template suggestions

3. **Review Templates:** View suggested templates with match scores in the Templates section

4. **Merge & Use:** Click "🚀 Merge & Use" on any template suggestion to:
   - Automatically extract key information from your prompt
   - Intelligently fill in template variables (like {context}, {question})
   - Replace your current prompt with the merged result
   - Switch to the Analyze tab to see the enhanced prompt

**Template Merging Benefits:**
- **Intelligent Mapping:** AI understands your intent and maps content to appropriate variables
- **Time-Saving:** No manual copying and pasting of template variables
- **Context-Aware:** Preserves the meaning and structure of your original prompt
- **One-Click Workflow:** Seamless transition from template selection to prompt enhancement

**Template Variables Supported:**
- **{context}**: Background information and context
- **{question}**: The main question or task
- **{format}**: Desired output format or structure
- **{examples}**: Example inputs/outputs when relevant
- **Custom variables**: Any template-specific variables are intelligently filled

---

## 📊 Project Status

### ✅ Completed (MVP v1.0)

This is what has been successfully built and is currently working in the application.

* **Core Application Framework:** A robust backend using **FastAPI** and a dynamic frontend using **React** and TypeScript.
* **Real-time Pattern Analysis:** An integrated rule-based system that detects over 20 prompt engineering patterns as the user types.
* **Template Suggestions:** A system that suggests relevant **LangChain Hub** templates based on a weighted score of the detected patterns.
* **Flexible LLM Provider Support:** The UI and backend are configured to use **Ollama (local), OpenRouter, and Groq**.
* **DSPy-Powered Optimization:** The core optimization engine is built using **DSPy's `BootstrapFewShot`**, capable of improving a prompt from a user-provided CSV or JSONL dataset.
* **Basic Guardrails:** The DSPy optimizer is configured with basic limits on the number of examples to generate (`max_boot_strapped_demos`).
* **Comparison UI:** A polished, side-by-side view to clearly compare the original prompt with the optimized version.

### 🚀 Completed (v1.1 - Enhanced AI Features)

* **LLM-as-a-Refiner:** Advanced pattern detection accuracy using LLM refinement for enhanced analysis precision with optional toggle in Pattern Analysis panel.
* **Advanced DSPy Metrics:** Support for both exact match and LLM-as-a-Judge (qualitative) optimization metrics for comprehensive prompt evaluation.
* **Cost Estimation & Guardrails:** Real-time cost estimation with configurable iteration limits and cost control features for responsible AI usage.
* **Intelligent Template Merging:** Automatically populate LangChain Hub templates with content from user prompts using LLM intelligence.

### ✅ Completed (v1.2 - Workflow Enhancements)

* **UI-Based Dataset Builder:** Modal interface allowing users to create datasets directly in the application with question-answer pairs, automatically converted to CSV format.
* **Export Options:** Complete export functionality for optimized prompts including JSON format with metadata and Python script format with usage examples.

---

## 🗺️ Planned Future Features

This is the roadmap for what can be built on top of the current MVP foundation.

### Core Functionality Enhancements
* **Configurable Guardrails & Timeouts:** A UI to allow users to set their own limits on optimization time, LLM calls, or iterations to better manage resources.

### Advanced AI & Optimization
* **Configurable Guardrails & Timeouts:** A UI to allow users to set their own limits on optimization time, LLM calls, or iterations to better manage resources.

### Platform & Workflow
* **Prompt Version History:** The ability to save different versions of a prompt, add notes, and easily revert to previous versions.
* **A/B Testing Framework:** A dedicated UI to compare two different prompt versions against a dataset and see which one performs better on key metrics.
* **User Accounts & Collaboration:** A full authentication system allowing users to save their prompts to the cloud, create projects, and share them with team members.

---

## 📄 License

This project is licensed under the MIT License.