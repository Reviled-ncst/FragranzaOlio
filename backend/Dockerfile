FROM php:8.2-apache

# Install PHP extensions
RUN docker-php-ext-install pdo pdo_mysql mysqli

# Enable Apache modules
RUN a2enmod rewrite headers

# Configure Apache: allow .htaccess overrides
RUN sed -i '/<Directory \/var\/www\/>/,/<\/Directory>/ s/AllowOverride None/AllowOverride All/' /etc/apache2/apache2.conf

# Railway uses PORT env var
RUN sed -i 's/Listen 80/Listen ${PORT}/' /etc/apache2/ports.conf \
    && sed -i 's/:80/:${PORT}/' /etc/apache2/sites-available/000-default.conf

# Copy backend files
COPY . /var/www/html/

# Create upload dirs
RUN mkdir -p /var/www/html/uploads/products \
             /var/www/html/uploads/attendance \
             /var/www/html/uploads/tasks \
    && chmod -R 777 /var/www/html/uploads

ENV PORT=8080
EXPOSE 8080
CMD ["apache2-foreground"]
