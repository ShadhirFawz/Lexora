<?php

return [
    'credentials' => storage_path('app/firebase/firebase_credentials.json'),
    'storage_bucket' => env('FIREBASE_STORAGE_BUCKET'), // set in .env
];
