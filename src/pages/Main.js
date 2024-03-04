import React, { useEffect, useState, useRef } from "react";
import {
    Text, View, StyleSheet, Alert, ScrollView, TextInput, NativeModules, Platform, Button, NativeEventEmitter,LogBox
} from "react-native";
import SDK from '../lib/ringSDK';
import { formatDateTime } from '../utils/TimeFormat';
import { bleModule } from '../module/BleModule'
import { Picker } from '@react-native-community/picker';
import { Svg, Path } from 'react-native-svg';
import EcgWave from '../components/ecgWave';
let drawInterval = null;
let irDrawInterval = null;
let redDrawInterval = null;
let sportEndTimeOut = null;
// let startStep = 0;
// let endStep = 0;
let ecgArray = [];
let isFirstArr = false;
let isStartEcg = false;
let startCount = false;
let hrValue = 0;
let hrvValue = 0;
let moodValue = 0;
let respiratoryRateE = 0;
let maxRR = 0;
let minRR = 0;
LogBox.ignoreLogs(['new NativeEventEmitter']); // Ignore log notification by message
LogBox.ignoreAllLogs();
const Main = ({ navigation, route }) => {
    // const step = "step";
    // const timeSyn = "timeSyn";
    // const openSingleHealth = "openSingleHealth";
    // const closeSingleHealth = "closeSingleHealth";
    // const openHealth = "openHealth";
    // const closeHealth = "closeHealth";
    // const temperature = "temperature";
    // const shutDown = "shutDown";
    // const restart = "restart";
    // const restoreFactorySettings = "restoreFactorySettings";
    // const historicalNum = "historicalNum";
    // const historicalData = "historicalData";
    // const cleanHistoricalData = "cleanHistoricalData";
    // const deviceInfo1 = "deviceInfo1";
    // const deviceInfo2 = "deviceInfo2";
    // const batteryDataAndState = "batteryDataAndState"
    // const deviceBind = "deviceBind"
    // const deviceUnBind = "deviceUnBind"
    // const setHrTime = "setHrTime"
    // const SetSportModeParameters = "SetSportModeParameters";
    const [waveData, setWaveData] = useState([]);
    const [irWaveData, setIrWaveData] = useState([]);
    const [redWaveData, setRedWaveData] = useState([]);
    const { bleName } = route.params;
    const [heartData, setHeartData] = useState({
        heartValue: 0,
        hrvValue: 0
    });
    const [healthData, setHealthData] = useState({
        oxValue: 0,
        heartValue: 0,
    });
    const [stepValue, setStepValue] = useState(0);
    const [deviceBindStatus, setDeviceBindStatus] = useState("");
    const [deviceUnBindStatus, setDeviceUnBindStatus] = useState("");
    const [temperatureValue, setTemperatureValue] = useState(0);
    const [shutDownStatus, setShutDownStatus] = useState("");
    const [restartStatus, setRestartStatus] = useState("");
    const [restoreFactorySettingsStatus, setRestoreFactorySettingsStatus] = useState("");
    const [cleanHistoricalDataStatus, setCleanHistoricalDataStatus] = useState("");
    const [timeSyncStatus, setTimeSyncStatus] = useState("");


    const [device1Value, setDevice1Value] = useState({
        color: 0,
        size: 0,
        bleAddress: 0,
        deviceVer: 0
    });

    const [device2Value, setDevice2Value] = useState({
        sn: 0,
    });

    const [device5Value, setDevice5Value] = useState({

    });

    const [battery, setBattery] = useState({
        batteryValue: 0,
        status: 0,
        batteryPer: 0
    })

    const [rePackage, setRePackage] = useState(
        {
            cmd: 0,
            result: 0,
            reason: ""
        }
    )

    const [history, setHistory] = useState({
        timeStamp: 0,
        heartRate: 0,
        motionDetectionCount: 0,
        detectionMode: 0,
        wearStatus: 0,
        chargeStatus: 0,
        uuid: 0,
        hrv: 0,
        temperature: 0,
        step: 0,
        ox: 0,
        rawHr: []
    })

    const [sleepTime, setSleepTime] = useState([])

    //
    const [progress, setProgress] = useState([])

    //静息心率
    const [restingHeartRate, setRestingHeartRate] = useState("");
    //呼吸率
    const [respiratoryRate, setRespiratoryRate] = useState("");
    //血氧饱和度
    const [oxygenSaturation, setOxygenSaturation] = useState([]);
    //心率沉浸
    const [heartRateImmersion, setHeartRateImmersion] = useState("");

    //心率测量时间
    const [heartRateTime, setHeartRateTime] = useState("");

    //血氧测试时间间隔
    const [oxMeasurementTimeInterval, setOxMeasurementTimeInterval] = useState("");

    //血氧测试开关
    const [oxMeasurementSwitch, setOxMeasurementSwitch] = useState("");
    
    
    //运动模式开关
    const [sportModeSwitch, setSportModeSwitch] = useState(1);
    //运动模式时间间隔
    const [sportModeTimeInterval, setSportModeTimeInterval] = useState("");
    //运动模式持续时间
    const [sportModeTimeDuration, setSportModeTimeDuration] = useState("");
    //运动模式选择
    const [sportType, setSportType] = useState(0);
    //运动强度
    const [strengthGrade, setStrengthGrade] = useState(0.05)
    //身高
    const [personalHeight, setPersonalHeight] = useState("");
    //oem 认证结果
    const [oemResult, setOemResult] = useState('')
    //卡路里
    const [calorie, setCalorie] = useState()
    //ecg
    const [ecgStart, setEcgStart] = useState(false);
    const [ecgWave, setEcgWave] = useState(0);
    const [ecgPrint, setEcgPrint] = useState("");

    const mArray = useRef([]);
    const mSleepTimeArray = useRef([]);
    const mHrArray = useRef([]);
    const currentCmd = useRef();
    const startOem = useRef(false);
    const endUUID = useRef(0);
    const startUUID = useRef(0);
    const historyDatas = useRef([])
    const sportStart = useRef(false);
    const drawWaveStart = useRef(true);
    const drawIrWaveStart = useRef(true);
    const drawRedWaveStart = useRef(true);

    const waveList = useRef([]);
    const irWaveList = useRef([]);
    const redWaveList = useRef([]);
    const [getHistoryStart, setHistoryStart] = useState(false)

    const { NativeSleepModule, SleepDataMoudle, NativeEcgModule } = NativeModules
    const ecgEmitter = new NativeEventEmitter(NativeEcgModule);
    let code = {
        deviceBindAndUnBind: 0x15,
        shutDown: 0x08,
        restart: 0x09,
        restoreFactorySettings: 0x0a,
        cleanHistoricalData: 0x0e,
        timeSyn: 0x04,
        switchOem: 0x19,
        startOem: 0x1B,
    }



    function sendData(cmd, data) {
        var result = SDK.startDetect(cmd, data);
        console.log(`sendData result=${Array.from(new Uint8Array(result))}`);
        return bleModule.write(Array.from(new Uint8Array(result)));
    }

    //Obtain JS version
    function getJSVersion() {
        var version = SDK.getJSVersion();
        console.log("version=", version);
    }

    //Calculate resting heart rate
    function calcRestingHeartRate(timeStamp = -1, refresh = true) {
        if (mHrArray.current.length != 0) {
            var restingHeartRate = SDK.calcRestingHeartRate(mHrArray.current, timeStamp);
            console.log(`Calculate resting heart rate restingHeartRate=${JSON.stringify(restingHeartRate)} `)
            if (typeof restingHeartRate == 'number') {
                if (refresh) {
                    setRestingHeartRate(Math.floor(restingHeartRate) + " BPM");
                }
                return restingHeartRate;
            } else if (restingHeartRate instanceof Array) {
                let result = ""
                for (let index = 0; index < restingHeartRate.length; index++) {
                    const element = restingHeartRate[index];
                    var ts = formatDateTime(element.ts, false);
                    var data = Math.floor(element.data);
                    result += ts + " restingHeartRate=" + data + " BPM "
                }
                if (refresh) {
                    setRestingHeartRate(result);
                }

                return restingHeartRate;
            }
        } else {
            showDialog();
        }

    }

    function initSleepData() {
        if (mArray.current.length != 0) {
            if (mSleepTimeArray.current.length == 0) {
                mSleepTimeArray.current = SDK.calcSleepTime(mArray.current);
            }
        } else {
            showDialog();
        }
    }

    //Calculate respiratory rate
    function calcRespiratoryRate(timeStamp = -1) {
        initSleepData();
        var result = SDK.calcRespiratoryRate(mSleepTimeArray.current, mArray.current, timeStamp);
        if (result?.type == 'number') {
            setRespiratoryRate(result.respiratoryRate + " BPM")
        } else if (result?.type == 'Array') {
            var arr = result?.result;
            var result = ""
            for (let index = 0; index < arr.length; index++) {
                const element = arr[index];
                result += (index + 1) + "group startTime" + formatDateTime(element.timeSlot.startTime) + "-> endTime" + formatDateTime(element.timeSlot.endTime) + " [respiratoryRate]:" + element.respiratoryRate + " BPM  "
            }
            setRespiratoryRate(result);
        }
    }


    //Blood oxygen saturation
    function getOxygenSaturation() {
        if (mArray.current.length != 0) {
            if (mSleepTimeArray.current.length == 0) {
                mSleepTimeArray.current = SDK.calcSleepTime(mArray.current);
            }
            let array = SDK.calcOxygenSaturation(mSleepTimeArray.current, mArray.current);
            for (let index = 0; index < array.length; index++) {
                var element = array[index];
                element.rawData = element.oxygen;
                element.oxygen = element.oxygen < 92 ? (Math.floor(Math.random() * 5) + 95) : element.oxygen
            }
            // console.log(` getOxygenSaturation array=${JSON.stringify(array)} mSleepTimeArray.current=${JSON.stringify(mSleepTimeArray.current)} mArray.current=${JSON.stringify(mArray.current)}  `)
            setOxygenSaturation(array)
        } else {
            showDialog();
        }
    }

    function showOxygenSaturation() {
        let result = ""
        for (let index = 0; index < oxygenSaturation.length; index++) {
            const element = oxygenSaturation[index];
            result += (index + 1) + "group startTime" + formatDateTime(element.startTime) + "-> endTime" + formatDateTime(element.endTime) + " [oxygen]:" + element.oxygen + "%  " + " [rawData]:" + element.rawData + "%  "
        }
        return result
    }

    //Obtain heart rate immersion
    function getHeartRateImmersion(timeStamp = -1) {
        initSleepData();
        var result = SDK.calcHeartRateImmersion(mSleepTimeArray.current, mArray.current, mHrArray.current, timeStamp)
        if (result.type == 'number') {
            setHeartRateImmersion(result + "%");
        } else if (result.type == 'Array') {
            var data = "";
            var arr = result.result
            for (let index = 0; index < arr.length; index++) {
                const element = arr[index];
                data += element.time + " heartRateImmersion:" + element.heartRateImmersion + "% "
            }
            setHeartRateImmersion(data);
        }
    }

    //Sleep data calculation
    function getSleepData() {
        if (mArray.current.length != 0) {
            if (Platform.OS == "android") {
                NativeSleepModule.getSleepData(mArray.current, (result) => {
                    var sleepTimeArray = [];
                    var sleepTimePeriodArray = [];
                    for (let index = 0; index < result.length; index++) {
                        const data = result[index];
                        var lightTime = 0;
                        var deepTime = 0;
                        var remTime = 0;
                        var wakeTime = 0;
                        var napTime = 0;
                        for (let index = 0; index < data.stagingList.length; index++) {
                            const element = data.stagingList[index];
                            switch (element.stagingType) {
                                case "NREM1":
                                    lightTime += element.endTime - element.startTime
                                    break
                                case "NREM3":
                                    deepTime += element.endTime - element.startTime
                                    break;
                                case "REM":
                                    remTime += element.endTime - element.startTime
                                    break;
                                case "WAKE":
                                    wakeTime += element.endTime - element.startTime
                                    break;
                                case "NAP":
                                    napTime += element.endTime - element.startTime
                                    break;
                            }
                        }
                        sleepTimeArray.push({
                            deepSleep: `deepTime= ${Math.floor(deepTime / (1000 * 60 * 60))}h${Math.floor((deepTime % (1000 * 60 * 60)) / (1000 * 60))}m`,
                            lightTime: `lightTime= ${Math.floor(lightTime / (1000 * 60 * 60))}h${Math.floor((lightTime % (1000 * 60 * 60)) / (1000 * 60))}m`,
                            remTime: `remTime= ${Math.floor(remTime / (1000 * 60 * 60))}h${Math.floor((remTime % (1000 * 60 * 60)) / (1000 * 60))}m`,
                            wakeTime: `wakeTime= ${Math.floor(wakeTime / (1000 * 60 * 60))}h${Math.floor((wakeTime % (1000 * 60 * 60)) / (1000 * 60))}m`,
                            napTime: `napTime= ${Math.floor(napTime / (1000 * 60 * 60))}h${Math.floor((napTime % (1000 * 60 * 60)) / (1000 * 60))}m`,
                            startTime: formatDateTime(data.startTime),
                            endTime: formatDateTime(data.endTime)
                        })
                        sleepTimePeriodArray.push({
                            sleepTimePeriod: {
                                startTime: data.startTime,
                                endTime: data.endTime
                            }
                        })
                    }
                    setSleepTime(sleepTimeArray);
                    mSleepTimeArray.current = sleepTimePeriodArray
                })
            } else {
                SleepDataMoudle.getIOSSleepData(mArray.current, (error, result) => {
                    var sleepTimeArray = [];
                    var sleepTimePeriodArray = [];
                    for (let index = 0; index < result.length; index++) {
                        const data = result[index];
                        var lightTime = 0;
                        var deepTime = 0;
                        var remTime = 0;
                        var wakeTime = 0;
                        var napTime = 0;
                        for (let index = 0; index < data.stagingList.length; index++) {
                            const element = data.stagingList[index];
                            switch (element.stagingType) {
                                case "NREM1":
                                    lightTime += element.endTime - element.startTime
                                    break
                                case "NREM3":
                                    deepTime += element.endTime - element.startTime
                                    break;
                                case "REM":
                                    remTime += element.endTime - element.startTime
                                    break;
                                case "WAKE":
                                    wakeTime += element.endTime - element.startTime
                                    break;
                                case "NAP":
                                    napTime += element.endTime - element.startTime
                                    break;
                            }
                        }
                        sleepTimeArray.push({
                            deepSleep: `deepTime= ${Math.floor(deepTime / (1000 * 60 * 60))}h${Math.floor((deepTime % (1000 * 60 * 60)) / (1000 * 60))}m`,
                            lightTime: `lightTime= ${Math.floor(lightTime / (1000 * 60 * 60))}h${Math.floor((lightTime % (1000 * 60 * 60)) / (1000 * 60))}m`,
                            remTime: `remTime= ${Math.floor(remTime / (1000 * 60 * 60))}h${Math.floor((remTime % (1000 * 60 * 60)) / (1000 * 60))}m`,
                            wakeTime: `wakeTime= ${Math.floor(wakeTime / (1000 * 60 * 60))}h${Math.floor((wakeTime % (1000 * 60 * 60)) / (1000 * 60))}m`,
                            napTime: `napTime= ${Math.floor(napTime / (1000 * 60 * 60))}h${Math.floor((napTime % (1000 * 60 * 60)) / (1000 * 60))}m`,
                            startTime: formatDateTime(data.startTime),
                            endTime: formatDateTime(data.endTime)
                        })
                        sleepTimePeriodArray.push({
                            sleepTimePeriod: {
                                startTime: data.startTime,
                                endTime: data.endTime
                            }
                        })
                    }
                    setSleepTime(sleepTimeArray);
                    mSleepTimeArray.current = sleepTimePeriodArray
                })
            }

            //js sdk
            // mSleepTimeArray.current = [];
            // mSleepTimeArray.current = SDK.calcSleepTime(mArray.current);
            // var sleepTimeArray = [];
            // for (let index = 0; index < mSleepTimeArray.current.length; index++) {
            //     sleepTimeArray.push({
            //         deepSleep: mSleepTimeArray.current[index].deepSleep,
            //         lightTime: mSleepTimeArray.current[index].lightTime,
            //         remTime: mSleepTimeArray.current[index].remTime,
            //         wakeTime: mSleepTimeArray.current[index].wakeTime,
            //         napTime: mSleepTimeArray.current[index].napTime,
            //         startTime: formatDateTime(mSleepTimeArray.current[index].sleepTimePeriod.startTime),
            //         endTime: formatDateTime(mSleepTimeArray.current[index].sleepTimePeriod.endTime)
            //     })
            // }
            // setSleepTime(sleepTimeArray);
        } else {
            showDialog();
        }
    }

    //Display sleep time data
    function showSleepTime() {
        let total = ""
        for (let index = 0; index < sleepTime.length; index++) {
            total += (index + 1) + "group startTime" + sleepTime[index].startTime + "-> endTime" + sleepTime[index].endTime + " [deepSleep]:" + sleepTime[index].deepSleep + " [lightTime]:" + sleepTime[index].lightTime + " [remTime]:" + sleepTime[index].remTime + " [wakeTime]:" + sleepTime[index].wakeTime + " [napTime]:" + sleepTime[index].napTime + "  "
        }
        return total
    }

    const showDialog = () => {
        Alert.alert(
            'Warning',
            'Please test historical data first',
            [
                { text: 'Cancel', style: 'cancel' },
            ],
            {
                cancelable: false
            }
        );
    }

    function dealStatus(data) {
        let result = data.result;
        switch (data.cmd) {
            case code.deviceBindAndUnBind:
                let isBind = (currentCmd.current == SDK.SendCmd.deviceBind)
                let title = isBind ? "Device binded" : "Device unbinded";
                let status = title + result;
                console.log(`=================currentCmd=${currentCmd.current}  deviceBind=${SDK.SendCmd.deviceBind}  isBind=${isBind} status=${status}`)
                if (isBind) {
                    setDeviceBindStatus(status)
                    setDeviceUnBindStatus("")
                } else {
                    setDeviceBindStatus("")
                    setDeviceUnBindStatus(status)
                }
                break;
            case code.shutDown:
                setShutDownStatus("Shutdown" + result);

                break;
            case code.restart:
                setRestartStatus("Restart" + result);
                break;
            case code.restoreFactorySettings:
                setRestoreFactorySettingsStatus("Factory reset" + result);
                break;
            case code.cleanHistoricalData:
                setCleanHistoricalDataStatus("Clear Historical Data" + result);
                break;
            case code.timeSyn:
                setTimeSyncStatus("Time synchronization" + result);
                break;
        }
    }



    const handleHeartRateTimeChange = (inputText) => {
        console.log(` inputText ${inputText}  `)
        if (/^\d*$/.test(inputText)) {
            setHeartRateTime(inputText);
        }
    };

    const handleOxMeasurementSwitchChange = (inputText) => {
        console.log(` inputText ${inputText}  `)
        if (/^\d*$/.test(inputText)) {
            setOxMeasurementSwitch(inputText);
        }
    };

    const handleOxMeasurementTimeIntervalChange = (inputText) => {
        console.log(` inputText ${inputText}  `)
        if (/^\d*$/.test(inputText)) {
            setOxMeasurementTimeInterval(inputText);
        }
    };

    const sportModeSwitchChange = (itemValue) => {
        setSportModeSwitch(itemValue);
        console.log(` sportModeSwitchChange itemValue ${itemValue}  `)
    };

    const sportTypeChange = (itemValue) => {
        setSportType(itemValue);
    }

    const sportModeTimeIntervalChange = (inputText) => {
        console.log(` inputText ${inputText}  `)
        if (/^\d*$/.test(inputText)) {
            setSportModeTimeInterval(inputText);
        }
    };

    const sportModeTimeDurationChange = (inputText) => {
        console.log(` inputText ${inputText}  `)
        if (/^\d*$/.test(inputText)) {
            setSportModeTimeDuration(inputText);
        }
    };

    const personalHeightChange = (inputText) => {
        console.log(` inputText ${inputText}  `)
        if (/^\d*$/.test(inputText)) {
            setPersonalHeight(inputText);
        }
    }

    const initItem = () => {
        let options = []
        let labels = ["Low intensity exercise", "Moderate intensity exercise", "High intensity exercise"];
        let values = [0.05, 0.08, 0.1];
        for (let i = 0; i < 3; i++) {
            options.push({
                label: labels[i],
                value: values[i]
            })
        }
        return options.map((option, index) => (
            <Picker.Item key={index} label={option.label} value={option.value} />
        ))

    }

    const handleExerciseUntensityChange = (itemValue) => {
        setStrengthGrade(itemValue)
    }
    //Calculate calories for a time period by obtaining the number of steps 
    //taken at the beginning and end of the time period from historical data, 
    //and combining height and strengthGrade to calculate the calories burned during this time period 
    const caloriesCalculation = (startStep, endStep) => {
        console.log(`caloriesCalculation   personalHeight=${personalHeight}  endStep=${endStep}  startStep=${startStep}`)
        if (personalHeight) {
            let step = endStep - startStep
            if (step > 0) {
                let calories = SDK.caloriesCalculation(personalHeight, step, strengthGrade);
                setCalorie(calories)
            }
        }
    }

    const registerEcg = () => {
        ecgEmitter.addListener(
            'ecgWaveListener',
            (data) => {
                if (data.value) {
                    if (startCount) {
                        ecgArray.push(data.value);
                        if (ecgArray.length == 2450) {

                            if (!isFirstArr) {
                                isFirstArr = true
                                setEcgStart(true);
                            } else {
                                setEcgStart(false);
                            }
                            setEcgWave(ecgArray);
                            ecgArray = [];
                        }
                    }
                    if (isStartEcg) {
                        startCount = true;
                        isFirstArr = false;
                    }
                }
            }
        );

        ecgEmitter.addListener(
            'ecgValueListener',
            (data) => {
                switch (data.type) {
                    case 'HR':
                        hrValue = data.value;
                        break;
                    case 'HRV':
                        hrvValue = data.value;
                        if (moodValue != 0) {
                            sendData(SDK.SendCmd.stopEcg)
                        }
                        break;
                    case 'Mood Index':
                        moodValue = data.value;
                        if (hrvValue != 0) {
                            sendData(SDK.SendCmd.stopEcg)
                        }
                        break;
                    case 'RESPIRATORY RATE':
                        respiratoryRateE = data.value;
                    case 'RR':
                        if (data.value > maxRR) {
                            maxRR = data.value;
                        } else if (data.value < minRR && data.value > 300) {
                            minRR = data.value;
                        } else if (minRR == 0 && data.value > 300) {
                            minRR = data.value;
                        }
                        break;
                }
                setEcgPrint(`hr=${hrValue} hrv=${hrvValue}  mood=${moodValue}  respiratoryRate=${respiratoryRateE} minRR=${minRR} maxRR=${maxRR}`);
            }
        );
        ecgEmitter.addListener(
            'ecgFingerListener',
            (data) => {
                if (!data.touch) {
                    showDialog();
                }
                console.log("  touch= " + data.touch);
            }
        );
    }


    useEffect(() => {
        //start OEM certification
        startOem.current = true
        sendData(SDK.SendCmd.deviceInfo1)
        //Obtain heart rate and blood oxygen
        registerEcg();
        const healthListener = {
            onResult: (data) => {
                if (data && data.status == 2) {
                    if (data.oxValue == 0) {
                        setHeartData({
                            heartValue: data.heartValue,
                            hrvValue: data.hrvValue,
                        })
                    } else {
                        if (data.oxValue >= 95) {
                            var ox = data.oxValue >= 100 ? 99 : data.oxValue;
                            setHealthData({
                                oxValue: ox,
                                heartValue: data.heartValue,
                            })
                        }
                    }
                }
            }
        }

        //BATTERY INFORMATION
        const batteryDataAndStateListener = {
            onResult: (data) => {
                if (data) {
                    var isWireless = false;
                    if (bleName) {
                        isWireless = bleName.toUpperCase().indexOf('W') == -1 ? false : true;
                    }
                    var charging = data.status == 1
                    var result = charging ? "charging" : "uncharged";
                    var batteryPer = 0
                    if (data.batteryPer) {
                        batteryPer = data.batteryPer;
                    } else {
                        batteryPer = SDK.calcBattery(data.batteryValue, charging, isWireless);
                    }
                    setBattery({
                        batteryValue: data.batteryValue,
                        status: result,
                        batteryPer
                    })
                }
            }
        }

        //Device Information 1
        const deviceInfo1Listener = {
            onResult: (data) => {
                if (data) {
                    var color = ""
                    if (data.color == 0) {
                        color = "Deep Black"
                    } else if (data.color == 1) {
                        color = "Silver"
                    } else if (data.color == 2) {
                        color = "Gold"
                    } else if (data.color == 3) {
                        color = "Rose Gold"
                    }
                    setDevice1Value({
                        color,
                        size: data.size,
                        bleAddress: data.bleAddress,
                        deviceVer: data.deviceVer,
                        switchOem: data.switchOem,
                        chargingMode: data.chargingMode,
                        mainChipModel: data.mainChipModel,
                        productIteration: data.productIteration,
                        hasSportsMode: data.hasSportsMode,
                    })
                    console.log(` device1Value.hasSportsMode=${device1Value.hasSportsMode} `)
                    if (data.switchOem && startOem.current) {
                        startOem.current = false
                        //Start oem certification
                        console.log(`  startOEMVerify============= `)
                        SDK.startOEMVerify((cmd, data) => {
                            sendData(cmd, data)
                        })
                    }
                }

            }
        }

        //Device Information 2
        const deviceInfo2Listener = {
            onResult: (data) => {
                setDevice2Value({
                    sn: data.sn,
                    // sosSwitch: data.sosSwitch,
                    // doubleClickCount: data.doubleClickCount,
                    // clickInterval: data.clickInterval,
                    // tapDetectionThreshold: data.tapDetectionThreshold,
                    // startTime: data.startTime,
                    // endTime: data.endTime,
                    bindStatus: data.bindStatus,
                    samplingRate: data.samplingRate,
                    // rawWaveSwitch: data.rawWaveSwitch
                })
            }
        }

        const deviceInfo5Listener = {
            onResult: (data) => {
                setDevice5Value({
                    hrMeasurementTime: data.hrMeasurementTime,
                    oxMeasurementInterval: data.oxMeasurementInterval,
                    oxMeasurementSwitch: data.oxMeasurementSwitch
                })
            }
        }


        //History Data
        const historicalDataListener = {
            onResult: (data) => {
                setHistoryStart(true)
                setProgress("start")
                if (endUUID.current == 0) {
                    setProgress("end")
                    setHistoryStart(false)
                    return
                }
                if (data.uuid != endUUID.current) {
                    if (data.uuid % 100 == 0) {
                        setProgress(`start ${data.uuid - startUUID.current}/${endUUID.current - startUUID.current} pieces`)
                    }

                    historyDatas.current.push(data)
                    console.log(` uuid=${data.uuid} endUUID=${endUUID.current} length=${historyDatas.current.length} data=${JSON.stringify(data)}`)
                } else {
                    setHistoryStart(false)
                    var arr = SDK.processHistoryData(historyDatas.current)
                    dealHistoryData(arr)
                }
            }
        }

        const dealHistoryData = (arr) => {
            // console.log(` dealHistoryData  arr=${arr.length} arr=${JSON.stringify(arr)}`)
            let historyData = []
            for (let index = 0; index < arr.length; index++) {
                const data = arr[index];
                console.log(`  data.hrv=${data.hrv}  formatDateTime=${formatDateTime(data.timeStamp)}`)
                // if (data.hrv > 0) {
                var wearStatus = data.wearStatus == 1 ? "wear" : "noWear";
                var chargeStatus = data.chargeStatus == 1 ? "charging" : "uncharged";
                var detectionModeStatus = data.detectionMode == 1 ? "BloodOxygenMode" : "HeartRateMode"
                historyData.push({
                    timeStamp: formatDateTime(data.timeStamp),
                    heartRate: data.heartRate,
                    motionDetectionCount: data.motionDetectionCount,
                    detectionMode: detectionModeStatus,
                    wearStatus: wearStatus,
                    chargeStatus: chargeStatus,
                    uuid: data.uuid,
                    hrv: data.hrv,
                    temperature: data.temperature,
                    step: data.reStep,
                    ox: data.ox,
                    rawHr: data.rawHr,
                    sportsMode: data.sportsMode
                })
                // }
                var isBadData = false
                if (data.rawHr == null) {
                    isBadData = false
                } else if (data.rawHr.length == 3 && data.rawHr[0] == 200 && data.rawHr[1] == 200 && data.rawHr[2] == 200) {
                    isBadData = true
                }

                if (data.heartRate >= 50 && data.heartRate <= 175 && data.wearStatus == 1 && data.chargeStatus == 0 && !isBadData) {
                    console.log(` formatDateTime=${formatDateTime(data.timeStamp)}`)
                    mArray.current.push({
                        ts: data.timeStamp,
                        hr: data.heartRate,
                        hrv: data.hrv,
                        motion: data.motionDetectionCount,
                        steps: data.step,
                        ox: data.ox
                    })
                }
                if (data.heartRate >= 60 && data.heartRate <= 175 && data.wearStatus == 1 && data.chargeStatus == 0 && !isBadData) {
                    mHrArray.current.push({
                        ts: data.timeStamp,
                        hr: data.heartRate,
                    })
                }
            }
            if (historyData.length > 0) {
                setHistory(historyData[historyData.length - 1])
            }

        }


        //Number of historical data
        const historicalNumListener = {
            onResult: (data) => {
                endUUID.current = data.maxUUID
                startUUID.current = data.minUUID
                console.log(`Number of historical data data=${JSON.stringify(data)}`)
            }
        }


        //Finger temperature
        const temperatureListener = {
            onResult: (data) => {
                if (data) {
                    setTemperatureValue(data);
                }
            }
        }

        //Repackaging
        const rePackageListener = {
            onResult: (data) => {
                if (data) {
                    setRePackage(
                        {
                            cmd: data.cmd,
                            result: data.result,
                            reason: data.reason
                        }
                    )
                    dealStatus(data);
                }
            }
        }

        const oemResultListener = {
            onResult: (data) => {
                var result = data ? "Verification successful" : "Verification fail"
                setOemResult(result);
            }
        }

        const irResouceListener = {
            onResult: (data) => {
                waveList.current.push(...data);
                if (waveList.current.length >= 600 && drawWaveStart.current) {
                    drawWaveStart.current = false
                    if (drawInterval) {
                        clearInterval(drawInterval)
                    }
                    startDraw()
                }
            }
        }

        const irOrRedListener = {
            onResult: (data) => {
                irWaveList.current.push(...data.irOrGreen);
                redWaveList.current.push(...data.redOrGreen);
                console.log(` irWaveList=${JSON.stringify(irWaveList)} redWaveList=${JSON.stringify(redWaveList)}`);
                if (irWaveList.current.length >= 600 && drawIrWaveStart.current) {
                    drawIrWaveStart.current = false
                    if (irDrawInterval) {
                        clearInterval(irDrawInterval)
                    }
                    startIrDraw();
                }
                if (redWaveList.current.length >= 600 && drawRedWaveStart.current) {
                    drawRedWaveStart.current = false
                    if (redDrawInterval) {
                        clearInterval(redDrawInterval)
                    }
                    startRedDraw();
                }
            }
        }


        getJSVersion();
        SDK.registerHealthListener(healthListener);
        SDK.registerBatteryDataAndStateListener(batteryDataAndStateListener);
        SDK.registerDeviceInfo1Listener(deviceInfo1Listener);
        SDK.registerDeviceInfo2Listener(deviceInfo2Listener);
        SDK.registerDeviceInfo5Listener(deviceInfo5Listener);
        SDK.registerHistoricalDataListener(historicalDataListener);
        SDK.registerHistoricalNumListener(historicalNumListener);
        SDK.registerTemperatureListener(temperatureListener);
        SDK.registerRePackageListener(rePackageListener);
        SDK.registerOEMResultListener(oemResultListener);
        SDK.registerIRresouceListener(irResouceListener);
        SDK.registerIRorRedListener(irOrRedListener);
        return () => {
            SDK.unregisterHealthListener();
            SDK.unregisterBatteryDataAndStateListener();
            SDK.unregisterDeviceInfo1Listener();
            SDK.unregisterDeviceInfo2Listener();
            SDK.unregisterDeviceInfo5Listener();
            SDK.unregisterHistoricalDataListener();
            SDK.unregisterHistoricalNumListener();
            SDK.unregisterTemperatureListener();
            SDK.unregisterRePackageListener();
            SDK.unregisterOEMResultListener();
            SDK.unregisterIRresouceListener();
            SDK.unregisterIRorRedListener();
            ecgEmitter.removeAllListeners('ecgWaveListener');
            ecgEmitter.removeAllListeners('ecgValueListener');
            ecgEmitter.removeAllListeners('ecgFingerListener');
        }
    }, []);

    const startDraw = () => {
        drawInterval = setInterval(() => {
            let arr = waveList.current.map(function (value, index) {
                if (index >= 0 && index <= 600) {
                    return value;
                } else {
                    return null;
                }
            }).filter(function (value) {
                return value !== null;
            });
            setWaveData(arr);
            waveList.current.splice(0, 80);
        }, 1000)
    }

    const getPath = () => {
        let max = Math.max(...waveData);
        let min = Math.min(...waveData);
        const dp = Math.abs(max - min) / 75;
        const path = waveData.reduce((acc, value, index) => {
            const x = index;
            // const y = 125 - (value - min) / dp;
            const y = (value - min) / dp;
            console.log(` y=${y} dp=${dp} min=${min} max=${max} value=${value}`)
            if (index === 0) {
                return `M ${x} ${y}`;
            } else {
                return `${acc} L ${x} ${y}`;
            }
        }, '');
        // console.log(` getPath =${JSON.stringify(path)} `)
        return path;
    };

    const startRedDraw = () => {
        redDrawInterval = setInterval(() => {
            let arr = redWaveList.current.map(function (value, index) {
                if (index >= 0 && index <= 600) {
                    return value;
                } else {
                    return null;
                }
            }).filter(function (value) {
                return value !== null;
            });
            setRedWaveData(arr);
            redWaveList.current.splice(0, 80);
        }, 1000)
    }

    const getRedPath = () => {
        let max = Math.max(...redWaveData);
        let min = Math.min(...redWaveData);
        const dp = Math.abs(max - min) / 75;
        if(dp!=0){
            const path = redWaveData.reduce((acc, value, index) => {
                const x = index;
                // const y = 125 - (value - min) / dp;
                const y = (value - min) / dp;
                if (index === 0) {
                    return `M ${x} ${y}`;
                } else {
                    return `${acc} L ${x} ${y}`;
                }
            }, '');
            // console.log(` getPath =${JSON.stringify(path)} `)
            return path;
        }
       
    };

    const startIrDraw = () => {
        irDrawInterval = setInterval(() => {
            let arr = irWaveList.current.map(function (value, index) {
                if (index >= 0 && index <= 600) {
                    return value;
                } else {
                    return null;
                }
            }).filter(function (value) {
                return value !== null;
            });
            setIrWaveData(arr);
            irWaveList.current.splice(0, 80);
        }, 1000)
    }

    const getIrPath = () => {
        let max = Math.max(...irWaveData);
        let min = Math.min(...irWaveData);
        const dp = Math.abs(max - min) / 75;
        const path = irWaveData.reduce((acc, value, index) => {
            const x = index;
            // const y = 125 - (value - min) / dp;
            const y = (value - min) / dp;
            if (index === 0) {
                return `M ${x} ${y}`;
            } else {
                return `${acc} L ${x} ${y}`;
            }
        }, '');
        // console.log(` getPath =${JSON.stringify(path)} `)
        return path;
    };

    const onSportMode = () => {
        console.log(` onSportMode  sportModeSwitch=${sportModeSwitch} `)
        if (sportModeSwitch == 1) {
            startStep = 0
            endStep = 0
            sportStart.current = true
            sendData(SDK.SendCmd.step)
            setTimeout(() => {
                sendData(SDK.SendCmd.SetSportModeParameters, {
                    switch: sportModeSwitch,
                    timeInterval: sportModeTimeInterval,
                    duration: sportModeTimeDuration,
                    mode: sportType
                })
            }, 1000)
            sportEndTimeOut = setTimeout(() => {
                sportStart.current = false
                sendData(SDK.SendCmd.step)
            }, sportModeTimeDuration * 60 * 1000 + 2000)
        } else {
            sendData(SDK.SendCmd.SetSportModeParameters, {
                switch: sportModeSwitch,
                timeInterval: sportModeTimeInterval,
                duration: sportModeTimeDuration,
                mode: sportType
            })
            if (sportEndTimeOut) {
                sportStart.current = false
                sendData(SDK.SendCmd.step)
                clearTimeout(sportEndTimeOut)
            }
        }
    }

    //血氧测量设置
    const setOxMeasurementSettings = () => {
        console.log(` oxMeasurementSwitch=${oxMeasurementSwitch} oxMeasurementTimeInterval=${oxMeasurementTimeInterval} `)
        sendData(SDK.SendCmd.oxSettings, {
            switch:oxMeasurementSwitch ,
            timeInterval:oxMeasurementTimeInterval ,
        });

    } 

    function initWave() {
        waveList.current = [];
        irWaveData.current = [];
        redWaveList.current = [];
        drawWaveStart.current = true;
        drawIrWaveStart.current = true;
    }

    return (
        <ScrollView horizontal={true}>
            <ScrollView>
                <View style={styles.viewHorizontal}>
                    <View style={styles.button}>
                        <Button onPress={() => onSportMode()} style={styles.button} title="Set SportMode"></Button>
                    </View>
                    <TextInput
                        placeholder="Please enter your height unit (cm)"
                        keyboardType="numeric"
                        style={styles.input}
                        value={personalHeight}
                        onChangeText={personalHeightChange}
                    />
                    <TextInput
                        placeholder="Record data time interval between 10 and 180 seconds"
                        keyboardType="numeric"
                        style={styles.input}
                        value={sportModeTimeInterval}
                        onChangeText={sportModeTimeIntervalChange}
                    />
                    <TextInput
                        placeholder="Duration 5-180 minutes"
                        keyboardType="numeric"
                        style={styles.input}
                        value={sportModeTimeDuration}
                        onChangeText={sportModeTimeDurationChange}
                    />
                    <Picker
                        style={{ width: 180 }}
                        selectedValue={sportModeSwitch}
                        onValueChange={sportModeSwitchChange}
                    >
                        <Picker.Item label="Sport mode on" value="1" />
                        <Picker.Item label="Sport mode off" value="0" />
                    </Picker>
                    <Picker
                        style={{ width: 180 }}
                        selectedValue={sportType}
                        onValueChange={sportTypeChange}
                    >
                        <Picker.Item label="Run" value="1" />
                        <Picker.Item label="Other sports" value="0" />
                    </Picker>
                    <Picker
                        style={styles.pickStyle}
                        selectedValue={strengthGrade}
                        onValueChange={handleExerciseUntensityChange}
                    >
                        {initItem()}
                    </Picker>
                </View>
                <View style={[styles.viewHorizontal, { display: calorie ? '' : 'none' }]}>

                    <Text style={styles.textStyle}>Calories burned: {calorie} Cal</Text>

                </View>
                <View style={styles.viewHorizontal}>
                    <View style={styles.button}>
                        <Button onPress={() => sendData(SDK.SendCmd.setHrTime, heartRateTime < 10 ? 10 : heartRateTime > 180 ? 180 : heartRateTime)} style={styles.button} title="Set Hr measure time"></Button>
                    </View>
                    <TextInput
                        placeholder="Please enter a number between 10 and 180"
                        keyboardType="numeric"
                        style={styles.input}
                        value={heartRateTime}
                        onChangeText={handleHeartRateTimeChange}
                    />
                </View>
                <View style={styles.viewHorizontal}>
                    <View style={styles.button}>
                        <Button onPress={() => setOxMeasurementSettings()} style={styles.button} title="Set Ox measure"></Button>
                    </View>
                    <TextInput
                        placeholder="Please enter a number 1(open) or 0(close)"
                        keyboardType="numeric"
                        style={styles.input}
                        value={oxMeasurementSwitch}
                        onChangeText={handleOxMeasurementSwitchChange}      
                    />
                    <TextInput
                        placeholder="Please enter a number between 5 and 360 minute"
                        keyboardType="numeric"
                        style={styles.input}
                        value={oxMeasurementTimeInterval}
                        onChangeText={handleOxMeasurementTimeIntervalChange}
                    />
                </View>
                <View style={styles.viewHorizontal}>
                    <View style={styles.button}>
                        <Button onPress={() =>
                            sendData(SDK.SendCmd.setHealthPara, {
                                samplingRate: device2Value.samplingRate, switch: 1
                            })}
                            style={styles.button} title="Turn on waveform"></Button>
                    </View>
                    <Text style={styles.textStyle}> </Text>
                </View>
                <View style={styles.viewHorizontal}>
                    <View style={styles.button}>
                        <Button onPress={() => sendData(SDK.SendCmd.setHealthPara, {
                            samplingRate: device2Value.samplingRate,
                            switch: 0
                        })} style={styles.button} title="Turn off waveform"></Button>
                    </View>
                    <Text style={styles.textStyle}> </Text>
                </View>
                <View style={styles.viewHorizontal}>
                    <View style={styles.button}>
                        <Button onPress={() => {
                            // if (drawInterval) {
                            //     clearInterval(drawInterval)
                            // }
                            sendData(SDK.SendCmd.openSingleHealth);
                            initWave();
                        }} style={styles.button} title="Turn on hr"></Button>
                    </View>
                    <Text style={styles.textStyle}> heart rate：{heartData.heartValue} hrv:{heartData.hrvValue}</Text>
                </View>
                <View style={styles.viewHorizontal}>
                    <View style={styles.button}>
                        <Button onPress={() => {
                            sendData(SDK.SendCmd.closeSingleHealth)
                            if (drawInterval) {
                                clearInterval(drawInterval)
                            }
                        }} style={styles.button} title="Turn off hr"></Button>
                    </View>
                    <Text style={styles.textStyle}></Text>
                </View>
                <View style={styles.viewHorizontal}>
                    <View style={styles.button}>
                        <Button onPress={() => {
                            // if (drawInterval) {
                            //     clearInterval(drawInterval)
                            // }
                            sendData(SDK.SendCmd.openHealth)
                            initWave();
                        }} style={styles.button} title="Turn on hr&ox"></Button>
                    </View>
                    <Text style={styles.textStyle}>Blood oxygen：{healthData.oxValue} heart rate：{healthData.heartValue} </Text>
                </View>
                <View style={styles.viewHorizontal}>
                    <View style={styles.button}>
                        <Button onPress={() => {
                            sendData(SDK.SendCmd.closeHealth)
                            if (drawInterval) {
                                clearInterval(drawInterval)
                            }
                        }} style={styles.button} title="Turn off hr&ox"></Button>
                    </View>
                    <Text style={styles.textStyle}></Text>
                </View>
                <View style={styles.viewHorizontal}>
                    <View style={styles.button}>
                        <Button onPress={() => sendData(SDK.SendCmd.shutDown)} style={styles.button} title="Shutdown"></Button>
                    </View>
                    <Text style={styles.textStyle}>{shutDownStatus}</Text>
                </View>
                <View style={styles.viewHorizontal}>
                    <View style={styles.button}>
                        <Button onPress={() => sendData(SDK.SendCmd.restart)} style={styles.button} title="Restart"></Button>
                    </View>
                    <Text style={styles.textStyle}>{restartStatus}</Text>
                </View>
                <View style={styles.viewHorizontal}>
                    <View style={styles.button}>
                        <Button onPress={() => sendData(SDK.SendCmd.restoreFactorySettings)} style={styles.button} title="Factory reset"></Button>
                    </View>
                    <Text style={styles.textStyle}>{restoreFactorySettingsStatus}</Text>
                </View>
                <View style={styles.viewHorizontal}>
                    <View style={styles.button}>
                        <Button onPress={() => sendData(SDK.SendCmd.cleanHistoricalData)} style={styles.button} title="clear history"></Button>
                    </View>
                    <Text style={styles.textStyle}>{cleanHistoricalDataStatus}</Text>
                </View>
                <View style={styles.viewHorizontal}>
                    <View style={styles.button}>
                        <Button onPress={
                            () => {
                                currentCmd.current = SDK.SendCmd.deviceBind
                                console.log(` cmd =${JSON.stringify(SDK.SendCmd.step)} `)
                                sendData(SDK.SendCmd.deviceBind)
                            }
                        } style={styles.button} title="Device binding"></Button>
                    </View>
                    <Text style={styles.textStyle}>{deviceBindStatus}</Text>
                </View>
                <View style={styles.viewHorizontal}>
                    <View style={styles.button}>
                        <Button onPress={() => {
                            currentCmd.current = SDK.SendCmd.deviceUnBind
                            sendData(SDK.SendCmd.deviceUnBind)
                        }} style={styles.button} title="Device unbinding"></Button>
                    </View>
                    <Text style={styles.textStyle}>{deviceUnBindStatus}</Text>
                </View>
                <View style={styles.viewHorizontal}>
                    <View style={styles.button}>
                        <Button onPress={() => {
                            startOem.current = true
                            sendData(SDK.SendCmd.deviceInfo1)
                        }} style={styles.button} title="Start OEM verify"></Button>
                    </View>
                    <Text style={styles.textStyle}>{oemResult}</Text>
                </View>
                <View style={styles.viewHorizontal}>
                    <View style={styles.button}>
                        <Button onPress={() => sendData(SDK.SendCmd.timeSyn)} style={styles.button} title="Time sync"></Button>
                    </View>
                    <Text style={styles.textStyle}>{timeSyncStatus}</Text>
                </View>

                {/* <View style={styles.viewHorizontal}>
                    <View style={styles.button}>
                        <Button onPress={() => sendData(SDK.SendCmd.step)} style={styles.button} title="Step data"></Button>
                    </View>
                    <Text style={styles.textStyle}>Steps：{stepValue.stepCount} StepAlgorithm:{stepValue.StepAlgorithm}</Text>
                </View> */}
                <View style={styles.viewHorizontal}>
                    <View style={styles.button}>
                        <Button onPress={() => sendData(SDK.SendCmd.temperature)} style={styles.button} title="Temperature data"></Button>
                    </View>
                    <Text style={styles.textStyle}>Finger temperature:{temperatureValue}°C</Text>
                </View>
                <View style={styles.viewHorizontal}>
                    <View style={styles.button}>
                        <Button onPress={() => sendData(SDK.SendCmd.deviceInfo1)} style={styles.button} title="Device Info 1 Data"></Button>
                    </View>

                    <Text style={styles.textStyle}>color：{device1Value.color} size:{device1Value.size}  bleAddress:{device1Value.bleAddress} deviceVer:{device1Value.deviceVer}
                        switchOem:{device1Value.switchOem} chargingMode:{device1Value.chargingMode}  mainChipModel:{device1Value.mainChipModel}  hasSportsMode:{device1Value.hasSportsMode} productIteration:{device1Value.productIteration} </Text>
                </View>
                <View style={styles.viewHorizontal}>
                    <View style={styles.button}>
                        <Button onPress={() => sendData(SDK.SendCmd.deviceInfo2)} style={styles.button} title="Device Info 2 Data"></Button>
                    </View>
                    <Text style={styles.textStyle}>sn:{device2Value.sn}  bindStatus:{device2Value.bindStatus}
                    </Text>
                </View>
                <View style={styles.viewHorizontal}>
                    <View style={styles.button}>
                        <Button onPress={() => sendData(SDK.SendCmd.deviceInfo5)} style={styles.button} title="Device Info 5 Data"></Button>
                    </View>
                    <Text style={styles.textStyle}>hrMeasurementTime:{device5Value.hrMeasurementTime}  oxMeasurementInterval:{device5Value.oxMeasurementInterval}  oxMeasurementSwitch:{device5Value.oxMeasurementSwitch}
                    </Text>
                </View>
                <View style={styles.viewHorizontal}>
                    <View style={styles.button}>
                        <Button onPress={() => sendData(SDK.SendCmd.batteryDataAndState)} style={styles.button} title="Battery Info"></Button>
                    </View>
                    <Text style={styles.textStyle}>batteryValue：{battery.batteryValue}mV status:{battery.status} batteryPer:{battery.batteryPer} </Text>
                </View>
                <View style={styles.viewHorizontal}>
                    <View style={styles.button}>
                        <Button onPress={() => {
                            mArray.current = [];
                            mHrArray.current = [];
                            historyDatas.current = [];
                            endUUID.current = 0;
                            sendData(SDK.SendCmd.historicalNum);
                            setTimeout(() => { sendData(SDK.SendCmd.historicalData) }, 500);
                        }} style={styles.button} title="History Data"></Button>
                    </View>
                    {getHistoryStart ?
                        <Text>{progress}</Text> :
                        <Text style={styles.textStyle}>chargeStatus:{history?.chargeStatus} detectionMode:{history.detectionMode} heartRate:{history.heartRate}
                            hrv:{history.hrv} motionDetectionCount:{history.motionDetectionCount}  step:{history.step}
                            temperature:{history.temperature} uuid:{history.uuid} wearStatus:{history.wearStatus} timeStamp:{history.timeStamp} ox:{history.ox} rawHr:{history.rawHr}  sportsMode:{history.sportsMode}</Text>}
                </View>
                <View style={styles.viewHorizontal}>
                    <View style={styles.button}>
                        <Button onPress={() => {
                            getSleepData();
                        }} style={styles.button} title="Sleep data"></Button>
                    </View>
                    <Text style={styles.textStyle}>
                        {showSleepTime()}
                    </Text>
                </View>
                <View style={styles.viewHorizontal}>
                    <View style={styles.button}>
                        <Button onPress={() => {
                            calcRestingHeartRate();
                        }} title="Resting heart rate"></Button>
                    </View>
                    <Text style={styles.textStyle}>
                        {restingHeartRate}
                    </Text>
                </View>
                <View style={styles.viewHorizontal}>
                    <View style={styles.button}>
                        <Button onPress={() => {
                            calcRespiratoryRate();
                        }} title="Respiratory rate"></Button>
                    </View>
                    <Text style={styles.textStyle}>
                        {respiratoryRate}
                    </Text>
                </View>
                <View style={styles.viewHorizontal}>
                    <View style={styles.button}>
                        <Button onPress={() => {
                            getOxygenSaturation();
                        }} title="Ox saturation"></Button>
                    </View>
                    <Text style={styles.textStyle}>
                        {showOxygenSaturation()}
                    </Text>
                </View>
                <View style={styles.viewHorizontal}>
                    <View style={styles.button}>
                        <Button onPress={() => {
                            getHeartRateImmersion();
                        }} title="Hr immersion"></Button>
                    </View>
                    <Text style={styles.textStyle}>
                        {heartRateImmersion}
                    </Text>
                </View>
                <View style={styles.viewHorizontal}>
                    <View style={styles.button}>
                        <Button onPress={() => {
                            if (Platform.OS == "ios") {
                                NativeEcgModule.startECG();
                            }
                            isShowDialog = true;
                            isStartEcg = true;
                            maxRR = 0;
                            minRR = 0;
                            sendData(SDK.SendCmd.startEcg);
                        }} title="start ECG"></Button>
                    </View>
                    <Text style={styles.textStyle}>
                        {ecgPrint}
                    </Text>
                </View>
                <View style={styles.viewHorizontal}>
                    <View style={styles.button}>
                        <Button onPress={() => {
                            if (Platform.OS == "ios") {
                                NativeEcgModule.stopECG();
                            }
                            isStartEcg = false;
                            sendData(SDK.SendCmd.stopEcg)
                        }} title="stop ECG"></Button>
                    </View>
                    <Text style={styles.textStyle}>

                    </Text>
                </View>
                <EcgWave data={ecgWave} start={ecgStart} />
                <View style={{ flexDirection: 'row', marginTop: 20 }}>
                    <Text style={{ width: 200, textAlign: 'center', textAlignVertical: 'center', fontSize: 15 }}>Packet response information</Text>
                    <Text style={styles.textStyle}>send cmd:{rePackage.cmd} result:{rePackage.result} reason:{rePackage.reason}  </Text>
                </View>
                <View style={styles.chart_container}>
                    <Svg width="500" height="200">
                        <Path d={getPath()} fill="none" stroke="blue" strokeWidth="2" />
                    </Svg>
                </View>
                <View style={styles.chart_container}>
                    <Svg width="500" height="200">
                        <Path d={getIrPath()} fill="none" stroke="green" strokeWidth="2" />
                    </Svg>
                </View>
                <View style={styles.chart_container}>
                    <Svg width="500" height="200">
                        <Path d={getRedPath()} fill="none" stroke="red" strokeWidth="2" />
                    </Svg>
                </View>
            </ScrollView>
        </ScrollView>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    button: {
        width: 150,
    },
    viewHorizontal: {
        flexDirection: 'row',
        alignItems: 'flex-end'
    },
    textStyle: {
        paddingLeft: 10
    },
    input: {
        height: 40,

        borderColor: 'blue',
        borderWidth: 0,
        borderBottomWidth: 1,
        paddingHorizontal: 10,
        marginRight: 10
    },
    pickStyle: {
        width: 270,
    },
    chart_container: {
        flex: 1,
        // alignItems: 'center',
        // justifyContent:'flex-start',
    },

})

export default Main;