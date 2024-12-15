# Dynamic Brain Visualizer

## Steps to Set Up and Run the Project

### 1. Clone the Repository

Clone the repository to your local machine:

```bash
git clone <repository-url>
```

### 2. Install Node.js and npm
   Download and install Node.js from https://nodejs.org/.

### 3. Install dependencies
```bash
npm install
```

### 4. Activate python virtual environment for the flask server
```bash
python -m venv myenv
source myenv/bin/activate # On macOS/Linux
myenv\Scripts\activate # On Windows
```

### 5. Install python dependencies
```bash
   pip install -r requirements.txt
```
### 6. Start development server
```bash
npm run dev
```

### 7. Launch the python server in src/py
```bash
python app.py
```

## Steps to create the data