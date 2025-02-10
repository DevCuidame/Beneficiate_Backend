sudo chmod -R 755 /home/beneficiate/uploads
sudo chown -R alopez:alopez /home/beneficiate/uploads
sudo chmod -R 777 /home/beneficiate/uploads


psql -U beneficiate_user -d beneficiate_db -f /home/alopez/ddl_create.sql
psql -U beneficiate_user -d beneficiate_db -f /home/alopez/dml_data.sql


sudo rm -rf /var/www/html/*
sudo apt update && sudo apt install -y unzip
unzip www.zip -d /var/www/html/


sudo chown -R www-data:www-data /var/www/html
sudo chmod -R 755 /var/www/html



sudo nano /etc/nginx/sites-available/default
