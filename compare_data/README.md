cd .\compare_data\

python --version
    Python 3.10.11

python -m venv venv

.\venv\Scripts\Activate.ps1


pip install psycopg2 cx_Oracle python-dotenv pandas

pip freeze > requirements.txt

pip install -r requirements.txt


### Run 
python.exe .\compare_data.py
