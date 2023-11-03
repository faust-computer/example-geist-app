import { connectToRos, subscribe, callService } from "./functions";
import { IGeistMsgsGpsData, IGeistSrvWhoAmIResponse } from "geist_common";
import { IVisionMsgs2DDetectionArray } from "geist_common";

// Main Execution

// Connect to ROS
const ros = connectToRos("ws://localhost:9091");

// Overview
// 1. Subscribe to the mobilenet_detections topic
// 2. when i see a person, i trigger an event
// 3. event triggers a storage engine service call
// 4. call SimpleNFT.sol, (locally for now) - methods: mintNFT, and testFunction

// Subscribe to the /ai/vision/mobilenet_detections topic
// This is assuming that you have the camera running (separate topic: send msg to July on telegram if issue persists)
const listener = subscribe<IVisionMsgs2DDetectionArray>(
  ros,
  "/ai/vision/mobilenet_detections",
  "vision_msgs/Detection2DArray",
  (message) => {
    console.log(`[Detection2DArray] {
        stamp: ${message.header.stamp.sec}.${message.header.stamp.nanosec},
        frame_id: ${message.header.frame_id},
        latitude: ${message.latitude},
        longitude: ${message.longitude},
        altitude: ${message.altitude}
      }`);

      if (message.detections.count > 1 && message.detections[0].id == '15') {
        // 2. check to see if this it is a person (15 is the identifier for person)

        const recordTopicDataRequest = {
          topic: "/ai/vision/mobilenet_detections",
          topic_type: "vision_msgs/Detection2DArray",
          target_path : "../bags"
          duration: 10,
          max_record_count: 20,
          storage_medium: 0, // 0 = rosbag
        };

        // 3. call the storage engine service
        callService<IGeistSrvRecordTopicDataResponse>(
          ros,
          "/storage_engine/record_topic_data",
          "geist/RecordTopicData",
          recordTopicDataRequest,
          (response) => {
            console.log(`Response for service call:
            Success: ${response.success}
            Version: ${response.version}`);
          }
        );

        // 4. call the SimpleNFT.sol contract
        const res = callService<IGeistSrvContractCallResponse>(
          ros, 
          "/onchain/contract_call",
          "geist/ContractCall",
          {
            path: "./artifacts/SimpleNFT.abi.json",
            address: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
            method: "mintNFT",
            inputs: [Input("string", "interesting_value")
          },
        )
      }
  }
);
