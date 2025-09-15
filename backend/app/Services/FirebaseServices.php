<?php

namespace App\Services;

use Google\Cloud\Storage\StorageClient;
use Illuminate\Support\Str;

class FirebaseService
{
    protected $storage;
    protected $bucket;

    public function __construct()
    {
        $this->storage = new StorageClient([
            'keyFilePath' => config('firebase.credentials'),
        ]);
        $this->bucket = $this->storage->bucket(config('firebase.storage_bucket'));
    }

    public function uploadFile($file, $folder = 'courses')
    {
        $filename = $folder . '/' . Str::uuid() . '.' . $file->getClientOriginalExtension();
        $stream = fopen($file->getRealPath(), 'r');

        $object = $this->bucket->upload($stream, [
            'name' => $filename,
            'predefinedAcl' => 'publicRead', // Make file public
        ]);

        fclose($stream);

        return sprintf(
            'https://storage.googleapis.com/%s/%s',
            $this->bucket->name(),
            $object->name()
        );
    }
}
