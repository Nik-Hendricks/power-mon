//Nik Hendricks 7-24-23
#define ETH_CLK_MODE ETH_CLOCK_GPIO17_OUT
#define ETH_PHY_POWER 12
#define MAX_UDP_MESSAGES 10 // Change this to the maximum number of UDP messages you want to store
#define MAX_EVENTS 10 // Change this to the maximum number of UDP messages you want to store

#include <stdlib.h>
#include <string.h>
#include <stdio.h>
#include <stdarg.h>
#include <ETH.h>
#include <WiFiUdp.h>

TaskHandle_t Task1;

WiFiUDP udp;

const int udpPort = 21212; // The port to listen on
static bool eth_connected = false;
IPAddress staticIP(172, 16, 127, 100); // Set your desired static IP address
IPAddress gateway(172, 16, 124, 1);    // Set your gateway IP address
IPAddress subnet(255, 0, 0, 0);   // Set your subnet mask
IPAddress dns1(8, 8, 8, 8);           // Set your primary DNS server
IPAddress dns2(8, 8, 4, 4);           // Set your secondary DNS server (optional)

struct EventFunctionPair {
  String event;
  void (*function)(char*);
};

// struct to hold the UDP message data and transmission status
struct UDP_Message {
    char* message;
    IPAddress targetIP;
    uint16_t targetPort;
    bool transmit; // Control field to determine if the message should be transmitted
    char* tag;
};

EventFunctionPair events[MAX_EVENTS];
int eventCount = 0;

// Create an array to store the UDP messages
struct UDP_Message udpMessages[MAX_UDP_MESSAGES];

void WiFiEvent(WiFiEvent_t event){
  switch (event) {
    case 18:
      Serial.println("ETH Started");
      //set eth hostname here
      ETH.setHostname("esp32-ethernet");
      break;
    case 22:
      Serial.println("ETH Connected");
      break;
    case 20:
      Serial.print("ETH MAC: ");
      Serial.print(ETH.macAddress());
      Serial.print(", IPv4: ");
      Serial.print(ETH.localIP());
      if (ETH.fullDuplex()) {
        Serial.print(", FULL_DUPLEX");
      }
      Serial.print(", ");
      Serial.print(ETH.linkSpeed());
      Serial.println("Mbps");
      eth_connected = true;
      break;
    case 21:
      Serial.println("ETH Disconnected");
      eth_connected = false;
      break;
    case 16:
      Serial.println("ETH Stopped");
      eth_connected = false;
      break;
    default:
      break;
  }
}
// Function to combine a variable number of strings
char* combine(int num_strings, ...) {
    // Calculate the total length needed for the combined string
    int total_length = 1; // 1 for the null terminator
    va_list args;
    va_start(args, num_strings);
    
    for (int i = 0; i < num_strings; i++) {
        total_length += strlen(va_arg(args, const char*));
    }
    va_end(args);

    // Allocate memory for the combined string
    char* combined_str = (char*)malloc(total_length);

    if (combined_str != NULL) {
        // Copy the contents of all strings into the combined string
        int position = 0;
        va_start(args, num_strings);
        for (int i = 0; i < num_strings; i++) {
            const char* current_str = va_arg(args, const char*);
            strcpy(combined_str + position, current_str);
            position += strlen(current_str);
        }
        va_end(args);
    }

    return combined_str;
}

// Function to split a string based on a delimiter
char** split(const char* str, const char* delimiter, int* num_tokens) {
    // Initialize variables
    *num_tokens = 0;
    char** tokens = NULL;
    char* temp_str = strdup(str);

    if (temp_str == NULL) {
        fprintf(stderr, "Memory allocation failed.\n");
        return NULL;
    }

    // Get the first token
    char* token = strtok(temp_str, delimiter);

    // Iterate through the string to count tokens
    while (token != NULL) {
        (*num_tokens)++;
        token = strtok(NULL, delimiter);
    }

    // Allocate memory for the tokens array
    tokens = (char**)malloc((*num_tokens) * sizeof(char*));
    if (tokens == NULL) {
        fprintf(stderr, "Memory allocation failed.\n");
        free(temp_str);
        return NULL;
    }

    // Reset the temp_str and get the first token again
    strcpy(temp_str, str);
    token = strtok(temp_str, delimiter);

    // Copy each token into the tokens array
    int i = 0;
    while (token != NULL) {
        tokens[i] = strdup(token);
        i++;
        token = strtok(NULL, delimiter);
    }

    // Free the temporary string
    free(temp_str);

    return tokens;
}

String generateTag(){
  uint16_t randomNumber = random(0, 65536); // Generate a random 16-bit number (0 to 65535)
  char buffer[17]; // Allocate space for the string representation (16 bits + null terminator)
  return itoa(randomNumber, buffer, 10);
}

void UDP_Send(char* message){
    int num_tokens;
    char** tokens = split(message, " ", &num_tokens);
    IPAddress targetIP = IPAddress(172, 16, 125, 77);
    uint16_t targetPort = 12121;
    char* tag = tokens[1];
    addUDPMessage(message, tag, targetIP, targetPort);
}

void UDP_Send_Once(char* message){
    IPAddress targetIP = IPAddress(172, 16, 125, 77);
    uint16_t targetPort = 12121;
    udp.beginPacket(targetIP, targetPort);
    udp.printf(message);
    udp.endPacket();
}

void UDP_Receive() {
  int packetSize = udp.parsePacket();
  if (packetSize) {
    char packetBuffer[255];
    int len = udp.read(packetBuffer, sizeof(packetBuffer));
    if (len > 0) {
      packetBuffer[len] = '\0'; // Null-terminate the string
      int num_tokens;
      char** tokens = split(packetBuffer, " ", &num_tokens);

      handleEvent(tokens[0], packetBuffer);
    }
  }
  delay(1); // Give some time to other tasks
}


// Task to retransmit UDP messages at a regular interval
void UDP_Retrans(void * pvParameters) {
    for(;;){
      Serial.println("Retransmitting UDP messages...");
      sendUDPMessages();
      delay(2000);
    }
}


// Function to add a new message to the data structure
bool addUDPMessage(char* message, char* tag, IPAddress targetIP, uint16_t targetPort) {
    // Find an available slot in the udpMessages array
    for (int i = 0; i < MAX_UDP_MESSAGES; i++) {
        if (!udpMessages[i].transmit) {
            udpMessages[i].message = message;
            udpMessages[i].targetIP = targetIP;
            udpMessages[i].targetPort = targetPort;
            udpMessages[i].transmit = true;
            udpMessages[i].tag = tag;
            return true; // Message added successfully
        }
    }
    return false; // No available slot to add the message
}

// Function to remove a message from the data structure
void removeUDPMessage(int index) {
    if (index >= 0 && index < MAX_UDP_MESSAGES) {
        udpMessages[index].message = NULL; // Clear the message
        udpMessages[index].targetIP = IPAddress(0, 0, 0, 0); // Set to an invalid IP address
        udpMessages[index].targetPort = 0; // Set to an invalid port
        udpMessages[index].transmit = false; // Set transmission status to false
    }
}

//null terminate any string
char* nullTerminateString(char* str) {
    // Calculate the string length using strlen
    int length = strlen(str);

    // Check if the string is already null-terminated or if its length is 0
    if (str[length - 1] != '\0') {
        // Append the null character at the end of the string
        str[length] = '\0';
    }

    return str; // Return the null-terminated string
}

int isNotEmptyOrNull(const char* str) {
    if (str == NULL) {
        // The string is NULL
        return 0;
    }

    // Check if the first character is the null terminator, indicating an empty string
    if (str[0] == '\0') {
        return 0;
    }

    // Compare the string with an empty string
    if (strcmp(str, "") == 0) {
        return 0;
    }

    // The string is not empty and not NULL
    return 1;
}


//function to remove UDP message from retrans array by TAG
void stopAndRemoveUDPTransmission(char* tag){
  for(int i = 0; i< MAX_UDP_MESSAGES; i++){
    if(isNotEmptyOrNull(udpMessages[i].tag)){
      if(strcmp(udpMessages[i].tag, tag) == 0){
        Serial.println("MESSAGE DOES EXIST REMOVING");
        removeUDPMessage(i);
      }
    }
  }
}

// Function to send all the messages marked for transmission
void sendUDPMessages() {
    for (int i = 0; i < MAX_UDP_MESSAGES; i++) {
        if (udpMessages[i].transmit) {
            udp.beginPacket(udpMessages[i].targetIP, udpMessages[i].targetPort);
            udp.printf(udpMessages[i].message);
            udp.endPacket();
            Serial.println("Done sending UDP Packet");
        }
    }
}

void handleEvent(char* event, char* message) {
  for (int i = 0; i < eventCount; i++) {
    if (events[i].event == event) {
      events[i].function(message);
      return;
    }
  }
  Serial.println("Event not found!");
}

//PMP specific funcions

void on_pmp_register(char* message){
  Serial.println("PMP REGISTER");
  int num_tokens;
  char** tokens = split(message, " ", &num_tokens);
  UDP_Send(combine(2, "g ", tokens[1]));
}

void on_pmp_good(char* message) {
  Serial.println("PMP GOOD");
  int num_tokens;
  char** tokens = split(message, " ", &num_tokens);
  stopAndRemoveUDPTransmission(tokens[1]); //removes transmisision by tag
  UDP_Send_Once(combine(2, "g ", tokens[1]));
}

void on_pmp_data(char* message){
  Serial.println("PMP DATA");
  int num_tokens;
  char** tokens = split(message, " ", &num_tokens);
  UDP_Send_Once(combine(3, "g ", tokens[1], " \n{data:'test'}"));
}

void setup(){
  Serial.begin(115200);
  WiFi.onEvent(WiFiEvent);
  ETH.begin();
  udp.begin(udpPort);
  UDP_Send(combine(2, "r ", generateTag()));
  randomSeed(micros());
  //ETH.config(staticIP, gateway, subnet, dns1, dns2);

  //Register PMP event handlers
  events[eventCount++] = {"r", on_pmp_register};
  events[eventCount++] = {"g", on_pmp_good};
  events[eventCount++] = {"d", on_pmp_data};

  xTaskCreatePinnedToCore(UDP_Retrans, "Task1", 30000, NULL, 1, &Task1, 0); /* pin task to core 0 */

  delay(500); 
}

void loop(){
  UDP_Receive();
}