# 📱 Telegram Order Notifications Setup

This guide will help you set up automatic Telegram notifications for every order received from both normal and express stores.

## 🤖 Step 1: Create Telegram Bot

1. **Open Telegram** and search for `@BotFather`
2. **Start a chat** with BotFather
3. **Send command**: `/newbot`
4. **Choose bot name**: `Jenny's Pudding Orders` (or any name you prefer)
5. **Choose username**: `jennys_pudding_orders_bot` (must end with 'bot')
6. **Copy the Bot Token** - You'll get something like: `123456789:ABCdefGHIjklMNOpqrsTUVwxyz`

## 🆔 Step 2: Get Your Chat ID

### Method 1: Using @userinfobot
1. Search for `@userinfobot` in Telegram
2. Start the bot and it will show your Chat ID

### Method 2: Manual method
1. Send a message to your new bot
2. Visit: `https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates`
3. Look for `"chat":{"id":123456789}` - that number is your Chat ID

## 🔧 Step 3: Environment Variables

Create a `.env.local` file in your project root (if it doesn't exist) and add these variables:

```env
# Telegram Bot Configuration
TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz
TELEGRAM_CHAT_ID=123456789
TELEGRAM_NOTIFICATIONS_ENABLED=true
```

**Important:** Replace the example values with your actual bot token and chat ID from steps 1 and 2.

## 📝 Step 4: Test Your Setup

You can test your bot by visiting this URL in your browser:
```
https://api.telegram.org/bot<YOUR_BOT_TOKEN>/sendMessage?chat_id=<YOUR_CHAT_ID>&text=Test message from Jenny's Pudding Bot!
```

Replace `<YOUR_BOT_TOKEN>` and `<YOUR_CHAT_ID>` with your actual values.

## 🚀 Step 5: Integration Code

The integration code has been added to your order processing functions:

- ✅ **Regular Orders**: `app/payment/page.tsx` - Sends notification after successful payment
- ✅ **Express Orders**: `app/express-payment/page.tsx` - Sends notification after successful payment
- ✅ **Telegram Library**: `lib/telegram.ts` - Handles all Telegram communication
- ✅ **Test API**: `app/api/test-telegram/route.ts` - For testing the integration

## 🧪 Testing the Integration

### Method 1: API Test Endpoints
1. **Test basic connection**: Visit `http://localhost:3000/api/test-telegram` in your browser
2. **Test order notification**: Send POST request to `http://localhost:3000/api/test-telegram`

### Method 2: Manual Test via Browser
```
http://localhost:3000/api/test-telegram
```

### Method 3: Test with Real Order
1. Go through the complete order process (normal or express)
2. Complete payment and upload proof
3. Check your Telegram for the notification

## 📱 Notification Features

- ✅ Order confirmation with details
- ✅ Customer information
- ✅ Delivery address and time
- ✅ Order items and total amount
- ✅ Payment method information
- ✅ Distinguish between normal and express orders

## 🔒 Security Notes

- Keep your bot token secure and never commit it to version control
- Use environment variables for all sensitive information
- Consider setting up a dedicated group chat for order notifications

## 📞 Support

If you encounter any issues:
1. Make sure the bot token is correct
2. Verify your chat ID is accurate
3. Check that environment variables are loaded properly
4. Test the bot manually first before integrating 