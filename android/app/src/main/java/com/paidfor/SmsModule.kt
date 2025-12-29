package com.paidfor

import android.Manifest
import android.content.pm.PackageManager
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.PermissionAwareActivity
import com.facebook.react.modules.core.PermissionListener

class SmsModule(reactContext: ReactApplicationContext) : 
    ReactContextBaseJavaModule(reactContext), 
    PermissionListener {
    
    companion object {
        const val SMS_PERMISSION_REQUEST_CODE = 1001
    }
    
    private var permissionPromise: Promise? = null
    
    override fun getName(): String = "SmsModule"
    
    override fun initialize() {
        super.initialize()
        // Set the React context for the broadcast receiver
        SmsReceiver.reactContext = reactApplicationContext
    }
    
    override fun invalidate() {
        super.invalidate()
        SmsReceiver.reactContext = null
    }
    
    @ReactMethod
    fun checkPermission(promise: Promise) {
        val hasReadSms = ContextCompat.checkSelfPermission(
            reactApplicationContext,
            Manifest.permission.READ_SMS
        ) == PackageManager.PERMISSION_GRANTED
        
        val hasReceiveSms = ContextCompat.checkSelfPermission(
            reactApplicationContext,
            Manifest.permission.RECEIVE_SMS
        ) == PackageManager.PERMISSION_GRANTED
        
        promise.resolve(hasReadSms && hasReceiveSms)
    }
    
    @ReactMethod
    fun requestPermission(promise: Promise) {
        val activity = currentActivity
        
        if (activity == null) {
            promise.reject("ACTIVITY_NULL", "Activity is null")
            return
        }
        
        val hasReadSms = ContextCompat.checkSelfPermission(
            reactApplicationContext,
            Manifest.permission.READ_SMS
        ) == PackageManager.PERMISSION_GRANTED
        
        val hasReceiveSms = ContextCompat.checkSelfPermission(
            reactApplicationContext,
            Manifest.permission.RECEIVE_SMS
        ) == PackageManager.PERMISSION_GRANTED
        
        if (hasReadSms && hasReceiveSms) {
            promise.resolve(true)
            return
        }
        
        permissionPromise = promise
        
        val permissions = arrayOf(
            Manifest.permission.READ_SMS,
            Manifest.permission.RECEIVE_SMS
        )
        
        if (activity is PermissionAwareActivity) {
            (activity as PermissionAwareActivity).requestPermissions(
                permissions,
                SMS_PERMISSION_REQUEST_CODE,
                this
            )
        } else {
            ActivityCompat.requestPermissions(
                activity,
                permissions,
                SMS_PERMISSION_REQUEST_CODE
            )
        }
    }
    
    override fun onRequestPermissionsResult(
        requestCode: Int,
        permissions: Array<out String>,
        grantResults: IntArray
    ): Boolean {
        if (requestCode == SMS_PERMISSION_REQUEST_CODE) {
            val allGranted = grantResults.all { it == PackageManager.PERMISSION_GRANTED }
            permissionPromise?.resolve(allGranted)
            permissionPromise = null
            return true
        }
        return false
    }
    
    @ReactMethod
    fun addListener(eventName: String) {
        // Required for RN built-in Event Emitter support
    }
    
    @ReactMethod
    fun removeListeners(count: Int) {
        // Required for RN built-in Event Emitter support
    }
}
