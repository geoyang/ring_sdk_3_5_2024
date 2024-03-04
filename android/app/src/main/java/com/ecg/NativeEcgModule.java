package com.ecg;

import com.facebook.react.bridge.ReactContextBaseJavaModule;

import android.widget.Toast;
import com.facebook.react.bridge.ReactApplicationContext;
import android.content.Context;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.Callback;
import java.util.List;
import java.util.ArrayList;
import android.util.Log;
import androidx.annotation.Nullable;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.modules.core.RCTNativeAppEventEmitter;
public class NativeEcgModule extends ReactContextBaseJavaModule implements EcgListener{

    // static {
    //     System.loadLibrary("NskAlgo");
    // }

    private ReactApplicationContext mContext;
    private Callback mDrawWaveCallBack;
    private Callback mSignalQualityCallBack;
    private Callback mECGValuesCallBack;
    private Callback mFingerDetectionCallBack;
    WritableMap ecgMap = Arguments.createMap();
    EcgManager ecgManager;

    public NativeEcgModule(ReactApplicationContext reactContext) {
        super(reactContext);
        mContext = reactContext;
        ecgManager = EcgManager.getInstance();
        ecgManager.init();
        ecgManager.setOnEcgResultListener(this);
    }

    @Override
    public String getName() {
        // 返回的这个名字是必须的，在rn代码中需要这个名字来调用该类的方法。
        return "NativeEcgModule";
    }

    @Override
    public void onDrawWave(int wave) {
        WritableMap map = Arguments.createMap();
		map.putInt("value", wave);
		sendEvent("ecgWaveListener", map);
    }

    @Override
    public void onSignalQuality(int level) {
        WritableMap map = Arguments.createMap();
		map.putInt("level", level);
		sendEvent("ecgSignalListener", map);
    }

    @Override
    public void onECGValues(int key, int value) {
        String type="";
        switch (key){
            case Constant.ECG_KEY_HEART_RATE://心率
                type="HR";
                break;
            case Constant.ECG_KEY_ROBUST_HR://稳定的心率
                type="ROBUST HR";
                break;
            case Constant.ECG_KEY_MOOD://心情指数
                type="Mood Index";
                break;
            case Constant.ECG_KEY_R2R://RR间隔
                type="RR";
                break;
            case Constant.ECG_KEY_HRV://心率变异性
                type="HRV";
                break;
            case Constant.ECG_KEY_HEART_AGE://心脏年龄
                type="HEART AGE";
                break;
            case Constant.ECG_KEY_STRESS://压力指数（精神压力）
                type="STRESS";
                break;
            case Constant.ECG_KEY_HEART_BEAT://心跳
                type="HEART BEAT";
            case Constant.ECG_KEY_RESPIRATORY_RATE://呼吸率
                type="RESPIRATORY RATE";
                break;
        }
        WritableMap map = Arguments.createMap();
		map.putString("type", type);
        map.putInt("value", value);
		sendEvent("ecgValueListener", map);
    }

    @Override
    public void onFingerDetection(boolean fingerDetected) {
        WritableMap map = Arguments.createMap();
		map.putBoolean("touch",fingerDetected);
		sendEvent("ecgFingerListener", map);
    }

    @ReactMethod
    public void dealData(ReadableArray bytes){
        byte[] byteArray = new byte[bytes.size()];
        for (int i = 0; i < bytes.size(); i++) {
            byteArray[i] = (byte) bytes.getInt(i);
        }
        ecgManager.dealEcgVal(byteArray);
    }

    private void sendEvent(String eventName, @Nullable WritableMap params) {
		mContext.getJSModule(RCTNativeAppEventEmitter.class).emit(eventName, params);
	}

 
}