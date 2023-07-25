//Nik Hendricks 7-24-23
#define ETH_CLK_MODE ETH_CLOCK_GPIO17_OUT
#define ETH_PHY_POWER 12

#include <stdio.h>
#include <stdarg.h>
#include <ETH.h>
#include <WiFiUdp.h>

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


const int MAX_EVENTS = 26; // Define the maximum number of events you want to handle
EventFunctionPair events[MAX_EVENTS];
int eventCount = 0;

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

void splitString(const char* str, const char* delimiter) {
    char buffer[100]; // Adjust the buffer size as needed
    strcpy(buffer, str); // Create a copy of the original string to work with

    char* token = strtok(buffer, delimiter);
    while (token != NULL) {
        printf("%s\n", token);
        token = strtok(NULL, delimiter);
    }
}

char* combineStrings(const char* format, ...) {
    static char buffer[1024]; // Adjust the buffer size as needed
    va_list args;
    va_start(args, format);

    vsnprintf(buffer, sizeof(buffer), format, args);

    va_end(args);
    return buffer;
}

void setup(){
  Serial.begin(115200);
  WiFi.onEvent(WiFiEvent);
  ETH.begin();
  udp.begin(udpPort);
  Serial.println(combineStrings("r", generateTag()));
  UDP_Send(combineStrings("r", generateTag()));
  randomSeed(micros());
  //ETH.config(staticIP, gateway, subnet, dns1, dns2);

  //setup events

  events[eventCount++] = {"r", on_pmp_register};
}

String generateTag(){
  uint16_t randomNumber = random(0, 65536); // Generate a random 16-bit number (0 to 65535)

  char buffer[17]; // Allocate space for the string representation (16 bits + null terminator)
  return itoa(randomNumber, buffer, 10);
}

void UDP_Send(char* message){
    udp.beginPacket(IPAddress(172, 16, 125, 77), 12121); // Change the target IP and port accordingly
    udp.printf(message);
    udp.endPacket();
    Serial.println("Done sending UDP Packet");
}

void UDP_Receive() {
  int packetSize = udp.parsePacket();
  if (packetSize) {
    char packetBuffer[255];
    int len = udp.read(packetBuffer, sizeof(packetBuffer));
    if (len > 0) {
      packetBuffer[len] = '\0'; // Null-terminate the string
      handleEvent("r", packetBuffer);
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

void on_pmp_register(char* message){
  Serial.println("PMP REGISTER");
  Serial.println(message);
  UDP_Send("g");
}


void loop()
{
  UDP_Receive();
}