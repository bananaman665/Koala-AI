# Firebase Configuration

Firebase backend for Koala.ai including Firestore, Storage, and Cloud Functions.

## Setup

1. Install Firebase CLI globally:
```bash
npm install -g firebase-tools
```

2. Login to Firebase:
```bash
firebase login
```

3. Initialize Firebase project:
```bash
firebase init
```

Select:
- ✅ Firestore
- ✅ Storage
- ✅ Functions
- ✅ Hosting (optional)

4. Configure environment variables:
```bash
firebase functions:config:set openai.key="YOUR_API_KEY"
```

## Project Structure

```
firebase/
├── firestore.rules       # Firestore security rules
├── storage.rules         # Storage security rules
├── firestore.indexes.json
└── firebase.json
```

## Firestore Collections

### users
- User profiles and settings
- Document ID: Firebase Auth UID

### lectures
- Lecture metadata
- Subcollection: `transcripts`, `notes`

### usage
- Track API usage per user
- Monthly quotas and billing

## Storage Structure

```
/audio-recordings/{userId}/{lectureId}.wav
/processed-audio/{userId}/{lectureId}.mp3
```

## Security Rules

- Users can only read/write their own data
- Audio files protected by user authentication
- Rate limiting on API calls

## Deployment

```bash
# Deploy all
npm run deploy

# Deploy only functions
npm run deploy:functions

# Deploy only rules
npm run deploy:rules
```

## Local Development

Run Firebase emulators:
```bash
npm run serve
```

Access:
- Firestore: http://localhost:8080
- Auth: http://localhost:9099
- Storage: http://localhost:9199
