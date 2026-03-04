# Google Document AI Setup Guide

## Overview
This app now includes **Google Document AI** integration for automated invoice extraction. Follow these steps to enable it.

## Setup Steps

### 1. Create a Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a Project" → "New Project"
3. Enter project name (e.g., "Invoice Extractor")
4. Click "Create"

### 2. Enable Document AI API
1. In Google Cloud Console, go to **APIs & Services** → **Library**
2. Search for **"Document AI API"**
3. Click on it and press **Enable**

### 3. Create a Service Account
1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **Service Account**
3. Enter service account name (e.g., "invoice-extractor")
4. Click **Create and Continue**
5. Grant it the role: **Editor** (or **Document AI API User** for least privilege)
6. Click **Continue** → **Done**

### 4. Create and Download Service Account Key
1. In **Credentials** page, find your service account (under "Service Accounts")
2. Click on it
3. Go to **Keys** tab
4. Click **Add Key** → **Create new key**
5. Select **JSON** format
6. Click **Create** (a .json file will download)

### 5. Create a Processor
1. Go to **Document AI** → **Processors**
2. Click **Create Processor**
3. Select **Invoice Parser** as the processor type
4. Choose region: **us (United States)**
5. Click **Create**
6. Copy the **Processor ID** (format: `abc123def456`)

### 6. Set Environment Variables
Add these to your `.env` file:

```env
GOOGLE_CLOUD_PROJECT_ID=your-project-id-here
GOOGLE_DOCUMENT_AI_PROCESSOR_ID=your-processor-id-here
GOOGLE_APPLICATION_CREDENTIALS=path-to-service-account-key.json
```

**Where to get these values:**
- `GOOGLE_CLOUD_PROJECT_ID`: In Google Cloud Console, top left corner shows "Project ID"
- `GOOGLE_DOCUMENT_AI_PROCESSOR_ID`: From the Processor you created (looks like `1234567890123456789`)
- `GOOGLE_APPLICATION_CREDENTIALS`: The full path to your downloaded JSON key file

### 7. Upload Service Account Key to Your App
1. Place the downloaded `service-account-key.json` file in your project root directory
2. Update the `GOOGLE_APPLICATION_CREDENTIALS` path in `.env` to point to it

## Usage

1. Navigate to `/invoice-extractor` page in your app
2. Upload an invoice PDF or image
3. Click "Extract Invoice Data"
4. The AI will extract:
   - Invoice number
   - Invoice date
   - Vendor/Seller information
   - Customer/Bill-to information
   - Line items
   - Subtotal, tax, and total amounts
   - All detected entities with confidence scores

## Supported File Formats
- PDF
- JPG
- JPEG
- PNG
- TIFF

## Pricing
- **Free tier**: 100 pages/month
- **Paid**: $1.50 per 1,000 pages after free quota

## Troubleshooting

**Error: "Google Cloud credentials not configured"**
- Check that `GOOGLE_CLOUD_PROJECT_ID` and `GOOGLE_DOCUMENT_AI_PROCESSOR_ID` are set in `.env`
- Restart the dev server after updating `.env`

**Error: "Authentication failed"**
- Ensure `GOOGLE_APPLICATION_CREDENTIALS` points to a valid service account JSON file
- Check that the service account has "Document AI API User" or "Editor" role

**Error: "Processor not found"**
- Verify the Processor ID is correct
- Ensure the processor is in the same region (us)
- Check that the processor is in "Active" state

## Security Note
- Never commit your `service-account-key.json` to git
- Add it to `.gitignore`
- Keep your credentials private
