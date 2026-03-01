<?php
/**
 * Cloudinary Service
 * Handles image uploads to Cloudinary CDN
 * 
 * Cloudinary is used instead of local filesystem because:
 * - Railway containers have ephemeral storage (files lost on redeploy)
 * - CDN-served images are faster and more reliable
 * - Automatic image optimization and transformations
 */

class CloudinaryService {
    private $cloudName;
    private $apiKey;
    private $apiSecret;
    private $uploadPreset;
    
    public function __construct() {
        $this->cloudName = getenv('CLOUDINARY_CLOUD_NAME') ?: '';
        $this->apiKey = getenv('CLOUDINARY_API_KEY') ?: '';
        $this->apiSecret = getenv('CLOUDINARY_API_SECRET') ?: '';
        $this->uploadPreset = getenv('CLOUDINARY_UPLOAD_PRESET') ?: '';
    }
    
    /**
     * Check if Cloudinary is configured
     */
    public function isConfigured(): bool {
        return !empty($this->cloudName) && !empty($this->apiKey) && !empty($this->apiSecret);
    }
    
    /**
     * Upload image from file path (tmp_name from $_FILES)
     * @param string $filePath Path to the temporary file
     * @param string $folder Cloudinary folder (e.g., 'products', 'reviews')
     * @param string|null $publicId Optional custom public ID
     * @return array{success: bool, url?: string, public_id?: string, error?: string}
     */
    public function uploadFile(string $filePath, string $folder = 'products', string $resourceType = 'image', ?string $publicId = null): array {
        if (!$this->isConfigured()) {
            return ['success' => false, 'error' => 'Cloudinary not configured'];
        }
        
        $timestamp = time();
        
        // Build upload parameters
        $params = [
            'folder' => "fragranza/{$folder}",
            'timestamp' => $timestamp,
            'overwrite' => 'true',
        ];
        
        if ($publicId) {
            $params['public_id'] = $publicId;
        }
        
        // Generate signature
        $params['signature'] = $this->generateSignature($params);
        $params['api_key'] = $this->apiKey;
        
        // Build multipart request - resource_type in URL, not in signed params
        $url = "https://api.cloudinary.com/v1_1/{$this->cloudName}/{$resourceType}/upload";
        
        $postFields = $params;
        $postFields['file'] = new \CURLFile($filePath);
        
        $ch = curl_init();
        curl_setopt_array($ch, [
            CURLOPT_URL => $url,
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => $postFields,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 30,
            CURLOPT_SSL_VERIFYPEER => true,
        ]);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlError = curl_error($ch);
        curl_close($ch);
        
        if ($curlError) {
            error_log("Cloudinary upload cURL error: {$curlError}");
            return ['success' => false, 'error' => "Upload failed: {$curlError}"];
        }
        
        $result = json_decode($response, true);
        
        if ($httpCode >= 200 && $httpCode < 300 && isset($result['secure_url'])) {
            return [
                'success' => true,
                'url' => $result['secure_url'],
                'public_id' => $result['public_id'],
                'width' => $result['width'] ?? null,
                'height' => $result['height'] ?? null,
                'format' => $result['format'] ?? null,
                'bytes' => $result['bytes'] ?? null,
            ];
        }
        
        $errorMsg = $result['error']['message'] ?? "HTTP {$httpCode}";
        error_log("Cloudinary upload failed: {$errorMsg}");
        return ['success' => false, 'error' => $errorMsg];
    }
    
    /**
     * Upload image from base64 data
     * @param string $base64Data Base64 encoded image (with or without data: prefix)
     * @param string $folder Cloudinary folder
     * @param string|null $publicId Optional custom public ID
     * @return array{success: bool, url?: string, public_id?: string, error?: string}
     */
    public function uploadBase64(string $base64Data, string $folder = 'products', ?string $publicId = null): array {
        if (!$this->isConfigured()) {
            return ['success' => false, 'error' => 'Cloudinary not configured'];
        }
        
        // Ensure data URI prefix exists
        if (!preg_match('/^data:/', $base64Data)) {
            $base64Data = 'data:image/png;base64,' . $base64Data;
        }
        
        $timestamp = time();
        
        // Build upload parameters
        $params = [
            'folder' => "fragranza/{$folder}",
            'timestamp' => $timestamp,
            'overwrite' => 'true',
        ];
        
        if ($publicId) {
            $params['public_id'] = $publicId;
        }
        
        // Generate signature
        $params['signature'] = $this->generateSignature($params);
        $params['api_key'] = $this->apiKey;
        $params['file'] = $base64Data;
        
        $url = "https://api.cloudinary.com/v1_1/{$this->cloudName}/image/upload";
        
        $ch = curl_init();
        curl_setopt_array($ch, [
            CURLOPT_URL => $url,
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => http_build_query($params),
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 30,
            CURLOPT_SSL_VERIFYPEER => true,
        ]);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlError = curl_error($ch);
        curl_close($ch);
        
        if ($curlError) {
            error_log("Cloudinary base64 upload cURL error: {$curlError}");
            return ['success' => false, 'error' => "Upload failed: {$curlError}"];
        }
        
        $result = json_decode($response, true);
        
        if ($httpCode >= 200 && $httpCode < 300 && isset($result['secure_url'])) {
            return [
                'success' => true,
                'url' => $result['secure_url'],
                'public_id' => $result['public_id'],
                'width' => $result['width'] ?? null,
                'height' => $result['height'] ?? null,
                'format' => $result['format'] ?? null,
                'bytes' => $result['bytes'] ?? null,
            ];
        }
        
        $errorMsg = $result['error']['message'] ?? "HTTP {$httpCode}";
        error_log("Cloudinary base64 upload failed: {$errorMsg}");
        return ['success' => false, 'error' => $errorMsg];
    }
    
    /**
     * Delete image from Cloudinary
     * @param string $publicId The public_id of the image to delete
     * @return array{success: bool, error?: string}
     */
    public function deleteImage(string $publicId): array {
        if (!$this->isConfigured()) {
            return ['success' => false, 'error' => 'Cloudinary not configured'];
        }
        
        $timestamp = time();
        $params = [
            'public_id' => $publicId,
            'timestamp' => $timestamp,
        ];
        
        $params['signature'] = $this->generateSignature($params);
        $params['api_key'] = $this->apiKey;
        
        $url = "https://api.cloudinary.com/v1_1/{$this->cloudName}/image/destroy";
        
        $ch = curl_init();
        curl_setopt_array($ch, [
            CURLOPT_URL => $url,
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => http_build_query($params),
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 15,
        ]);
        
        $response = curl_exec($ch);
        curl_close($ch);
        
        $result = json_decode($response, true);
        
        if (isset($result['result']) && $result['result'] === 'ok') {
            return ['success' => true];
        }
        
        return ['success' => false, 'error' => $result['result'] ?? 'Delete failed'];
    }
    
    /**
     * Generate Cloudinary API signature
     */
    private function generateSignature(array $params): string {
        // Remove non-signable params
        unset($params['file'], $params['api_key'], $params['resource_type'], $params['signature']);
        
        // Sort alphabetically
        ksort($params);
        
        // Build string to sign
        $toSign = http_build_query($params, '', '&', PHP_QUERY_RFC3986);
        // Cloudinary expects unencoded values in signature
        $toSign = urldecode($toSign);
        
        return sha1($toSign . $this->apiSecret);
    }
}
