<?php

namespace App\Services;

use Cloudinary\Cloudinary;
use Cloudinary\Configuration\Configuration;

class CloudinaryService
{
    protected $cloudinary;

    public function __construct()
    {
        Configuration::instance([
            'cloud' => [
                'cloud_name' => env('CLOUDINARY_CLOUD_NAME'),
                'api_key' => env('CLOUDINARY_API_KEY'),
                'api_secret' => env('CLOUDINARY_API_SECRET'),
            ],
            'url' => [
                'secure' => true
            ]
        ]);

        $this->cloudinary = new Cloudinary();
    }

    public function upload($file, $folder = 'courses')
    {
        try {
            $result = $this->cloudinary->uploadApi()->upload(
                $file->getRealPath(),
                [
                    'folder' => $folder,
                    'resource_type' => 'auto'
                ]
            );

            return $result['secure_url'];
        } catch (\Exception $e) {
            throw new \Exception('Cloudinary upload failed: ' . $e->getMessage());
        }
    }

    public function delete($publicId)
    {
        try {
            return $this->cloudinary->uploadApi()->destroy($publicId);
        } catch (\Exception $e) {
            throw new \Exception('Cloudinary delete failed: ' . $e->getMessage());
        }
    }
}
