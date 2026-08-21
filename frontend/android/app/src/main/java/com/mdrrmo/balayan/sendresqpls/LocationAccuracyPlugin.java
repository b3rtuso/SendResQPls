package com.mdrrmo.balayan.sendresqpls;

import android.app.Activity;
import androidx.activity.result.ActivityResult;
import androidx.annotation.NonNull;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;

import com.google.android.gms.common.api.ResolvableApiException;
import com.google.android.gms.location.LocationRequest;
import com.google.android.gms.location.LocationServices;
import com.google.android.gms.location.LocationSettingsRequest;
import com.google.android.gms.location.LocationSettingsResponse;
import com.google.android.gms.location.Priority;
import com.google.android.gms.tasks.OnCompleteListener;
import com.google.android.gms.tasks.Task;

@CapacitorPlugin(name = "LocationAccuracy")
public class LocationAccuracyPlugin extends Plugin {

    @PluginMethod
    public void enableLocation(PluginCall call) {
        try {
            LocationRequest locationRequest = new LocationRequest.Builder(Priority.PRIORITY_HIGH_ACCURACY, 1000)
                    .setMinUpdateIntervalMillis(500)
                    .build();

            LocationSettingsRequest.Builder builder = new LocationSettingsRequest.Builder()
                    .addLocationRequest(locationRequest)
                    .setAlwaysShow(true); // Triggers native Google Play Services dialog directly

            Task<LocationSettingsResponse> task = LocationServices.getSettingsClient(getActivity()).checkLocationSettings(builder.build());

            task.addOnCompleteListener(new OnCompleteListener<LocationSettingsResponse>() {
                @Override
                public void onComplete(@NonNull Task<LocationSettingsResponse> task) {
                    try {
                        LocationSettingsResponse response = task.getResult(Exception.class);
                        // All location settings are already satisfied
                        JSObject ret = new JSObject();
                        ret.put("enabled", true);
                        call.resolve(ret);
                    } catch (Exception exception) {
                        if (exception instanceof ResolvableApiException) {
                            try {
                                ResolvableApiException resolvable = (ResolvableApiException) exception;
                                startActivityForResult(call, resolvable.getResolution().getIntentSender(), "handleLocationResolution");
                            } catch (Exception e) {
                                JSObject ret = new JSObject();
                                ret.put("enabled", false);
                                ret.put("error", "Could not start resolution: " + e.getMessage());
                                call.resolve(ret);
                            }
                        } else {
                            JSObject ret = new JSObject();
                            ret.put("enabled", false);
                            ret.put("error", "Settings resolution unavailable: " + exception.getMessage());
                            call.resolve(ret);
                        }
                    }
                }
            });
        } catch (Exception e) {
            JSObject ret = new JSObject();
            ret.put("enabled", false);
            ret.put("error", e.getMessage());
            call.resolve(ret);
        }
    }

    @ActivityCallback
    private void handleLocationResolution(PluginCall call, ActivityResult result) {
        JSObject ret = new JSObject();
        if (result.getResultCode() == Activity.RESULT_OK) {
            ret.put("enabled", true);
        } else {
            ret.put("enabled", false);
        }
        call.resolve(ret);
    }
}
