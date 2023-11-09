use roslibrust::ClientHandle;
use eyre::{Result, Error};
use log;
use std::sync::Arc;
use tokio::sync::Mutex;
use geist_common::common::{
    Inputs,
    ContractOpMode,
    CreateProofRequest,
    CreateProofResponse,
    RecordTopicDataRequest,
    RecordTopicDataResponse,
    ContractCallRequest,
    ContractCallResponse,
};

#[cfg(target_os = "linux")]
fn get_ip_address() -> String {
    "localhost".to_string()
}

#[cfg(target_os = "macos")]
fn get_ip_address() -> String {
   "172.17.0.2".to_string()
}

#[tokio::main(flavor = "multi_thread")]
async fn main() -> Result<(), Error> {
    simple_logger::SimpleLogger::new()
        .with_level(log::LevelFilter::Info)
        .without_timestamps() // Required for running in wsl2
        .init()
        .unwrap();

    let url = format!("ws://{}:9091", get_ip_address());
    let client = ClientHandle::new(url).await?;
    let client_arc = Arc::new(Mutex::new(client));

    // first call service once
    let record_topic_res = call_record_topic_service(client_arc.clone()).await;
    // unwrap and log the res
    log::info!("record topic res: {:?}", record_topic_res);

    // pass in target path from res
    let proof_res = call_create_proof_service(client_arc.clone(), record_topic_res.unwrap()).await;
    log::info!("proof res: {:?}", proof_res);

    // call contract call service
    call_contract_call_service(client_arc.clone(), proof_res.unwrap()).await;

    Ok(())
}

/// call the record topic service
async fn call_record_topic_service(client: Arc<Mutex<ClientHandle>>) -> Result<String, Error> {
    let client = client.lock().await;

    // get the current pwd
    let pwd = std::env::current_dir().unwrap();
    let target_path = pwd.to_str().unwrap().to_string() + "/bags";

    let request = RecordTopicDataRequest {
        topic: "/sensors/gps_data".to_string(),
        duration: 5.0,
        target_path: target_path.clone(),
        max_record_count: 5,
        storage_medium: 0,
    };

    log::info!("request: {:?}", request);
    let result = client
        .call_service::<RecordTopicDataRequest, RecordTopicDataResponse>(
            "/storage_engine/record_topic_data",
            request,
        )
        .await
        .expect("Error while calling get hello world service");

    // return target_path
    Ok(result.path)
}

/// call create proof service
async fn call_create_proof_service(client: Arc<Mutex<ClientHandle>>, target_path: String) -> Result<String, Error> {
    let client = client.lock().await;

    let new_target_path = target_path.clone() + "/bag_0.db3";

    let request = CreateProofRequest {
        path: new_target_path,
        proof_type: 0,
    };

    log::info!("request: {:?}", request);
    let result = client
        .call_service::<CreateProofRequest, CreateProofResponse>(
            "/attestation/create_proof",
            request,
        )
        .await
        .expect("Error while calling get hello world service");

    log::info!("result: {:?}", result);

    Ok(result.proof)
}

async fn call_contract_call_service(client: Arc<Mutex<ClientHandle>>, proof: String) {
    let client = client.lock().await;

    let request = ContractCallRequest {
        path: "SimpleNFT.abi.json".to_string(),
        address: "0x5FbDB2315678afecb367f032d93F642f64180aa3".to_string(), 
        method: "mintNFT".to_string(),
        op: ContractOpMode {
            mode: ContractOpMode::SET,
        },
        chain_id: 11155111,
        inputs: vec![
            Inputs {
                key: "String".to_string(),
                value: "New Token".to_string(),
            }
        ],
        output: "".to_string(),
    };
    log::info!("request: {:?}", request);
    let result = client
        .call_service::<ContractCallRequest, ContractCallResponse>(
            "/onchain/contract_call",
            request,
        )
        .await
        .expect("Error while calling get hello world service");

    log::info!("result: {:?}", result);
}
