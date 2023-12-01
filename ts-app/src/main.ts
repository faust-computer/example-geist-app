import { connectToRos, subscribe, callService } from "./functions";
import { IMsgsGpsData, IServiceMsgsContractCallResponse, IServiceMsgsRecordTopicDataResponse } from "geist_common";
import { IVisionMsgsDetection2DArray } from "geist_common";

// Main Execution

// Connect to ROS
const ros = connectToRos("ws://localhost:9091");

// Overview
// 1. Subscribe to the gps data topic
// 2. when i see a person, i trigger an event
// 3. event triggers a storage engine service call
// 4. call SimpleNFT.sol, (locally for now) - methods: mintNFT, and testFunction

// Subscribe to the gps data topic
const topicName = "/sensors/gps_data";
const topicType = "common/msg/GPSData";
const listener = subscribe<IMsgsGpsData>(
  ros,
  topicName,
  topicType,
  (message) => {
    console.log(`[GPSData] {
        stamp: ${message.header.stamp.sec}.${message.header.stamp.nanosec},
        frame_id: ${message.header.frame_id},
        latitude: ${message.latitude},
        longitude: ${message.longitude},
        altitude: ${message.altitude}
    }`);
  }
);

// setup pwd
const pwd = process.env.PWD;
const target_path = pwd + "/bags";
console.log(`pwd: ${target_path}`);

const recordTopicDataRequest = {
  topic: topicName,
  duration: 5,
  target_path : target_path,
  max_record_count: 10,
  storage_medium: 0, // 0 = rosbag
};

// 3. call the storage engine service
const recordTopic = "/storage_engine/record_topic_data";
const recordTopicType = "geist/RecordTopicData";
const recordTopicService = callService<IServiceMsgsRecordTopicDataResponse>(
  ros,
  recordTopic,
  recordTopicType,
  recordTopicDataRequest,
  (response) => {
    console.log(`Response for record_topic_data service call:
    Success: ${response.success}
    Message: ${response.message}}`);
  }
);

// 4. call the SimpleNFT.sol contract
// const contractCall = "/onchain/contract_call";
// const contractCallType = "geist/ContractCall";
// const contractCallService = callService<IServiceMsgsContractCallResponse>(
//   ros, 
//   contractCall,
//   contractCallType,
//   {
//     path: "./artifacts/SimpleNFT.abi.json",
//     address: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
//     method: "mintNFT",
//     inputs: [Input("string", "interesting_value")]
//   },
//   (response) => {
//     console.log(`Response for service call:
//     Success: ${response.success}`);
//   }
// );
