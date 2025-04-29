### Install 
    Tạo môi trường ảo 
        python3 -m venv venv
    
    Sau đó kích hoạt môi trường ảo
        .\venv\bin\activate
    
    Cài đặt các packages
        (venv) pip install psycopg==3.2.6 cx_Oracle python-dotenv tabulate

    Set biến môi trường cho Postgresql
        Add PATH : C:\Program Files\PostgreSQL\17\bin
            
    Chạy PG
        (venv) PS D:\labs\diff-schema> python3.12.exe .\compare_schemas.py