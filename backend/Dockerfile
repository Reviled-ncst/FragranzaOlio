FROM php:8.2-apache

# Install PHP extensions needed for the project
RUN docker-php-ext-install pdo pdo_mysql mysqli

# Enable Apache modules
RUN a2enmod rewrite headers

# Set document root to backend folder
ENV APACHE_DOCUMENT_ROOT=/var/www/html

# Copy backend files
COPY . /var/www/html/

# Create uploads directories with proper permissions
RUN mkdir -p /var/www/html/uploads/products \
             /var/www/html/uploads/attendance \
             /var/www/html/uploads/tasks \
    && chown -R www-data:www-data /var/www/html/uploads \
    && chmod -R 755 /var/www/html/uploads

# Configure Apache to allow .htaccess overrides
RUN sed -i '/<Directory \/var\/www\/>/,/<\/Directory>/ s/AllowOverride None/AllowOverride All/' /etc/apache2/apache2.conf

# Railway uses PORT env var - configure Apache to listen on it
RUN sed -i 's/Listen 80/Listen ${PORT}/' /etc/apache2/ports.conf \
    && sed -i 's/:80/:${PORT}/' /etc/apache2/sites-available/000-default.conf

# Use PORT env variable (Railway sets this automatically)
ENV PORT=8080

EXPOSE 8080

CMD ["apache2-foreground"]
