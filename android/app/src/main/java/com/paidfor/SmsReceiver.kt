package com.paidfor

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.provider.Telephony
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactContext
import com.facebook.react.modules.core.DeviceEventManagerModule

class SmsReceiver : BroadcastReceiver() {
    companion object {
        var reactContext: ReactContext? = null
    }

    override fun onReceive(context: Context?, intent: Intent?) {
        if (intent?.action == Telephony.Sms.Intents.SMS_RECEIVED_ACTION) {
            val messages = Telephony.Sms.Intents.getMessagesFromIntent(intent)
            
            messages?.forEach { smsMessage ->
                val sender = smsMessage.originatingAddress ?: ""
                val body = smsMessage.messageBody ?: ""
                val timestamp = smsMessage.timestampMillis

                // Send to React Native
                sendSmsEvent(sender, body, timestamp)
            }
        }
    }

    private fun sendSmsEvent(sender: String, body: String, timestamp: Long) {
        reactContext?.let { context ->
            if (context.hasActiveReactInstance()) {
                val params = Arguments.createMap().apply {
                    putString("address", sender)
                    putString("body", body)
                    putDouble("date", timestamp.toDouble())
                }

                context
                    .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                    .emit("onSmsReceived", params)
            }
        }
    }
}
