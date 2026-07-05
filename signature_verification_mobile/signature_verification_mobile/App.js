import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { registerRootComponent } from "expo";

import LoginScreen      from "./app/screens/LoginScreen";
import RegisterScreen   from "./app/screens/RegisterScreen";
import HomeScreen       from "./app/screens/HomeScreen";
import PredictionScreen from "./app/screens/PredictionScreen";
import AdminScreen      from "./app/screens/AdminScreen";

const Stack = createNativeStackNavigator();

function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Login"
        screenOptions={{
          headerStyle:      { backgroundColor: "#1a1a2e" },
          headerTintColor:  "#00ffc8",
          headerTitleStyle: { fontWeight: "bold" },
          contentStyle:     { backgroundColor: "#0f0c29" },
        }}
      >
        <Stack.Screen name="Login"      component={LoginScreen}      options={{ headerShown: false }} />
        <Stack.Screen name="Register"   component={RegisterScreen}   options={{ title: "Create Account" }} />
        <Stack.Screen name="Home"       component={HomeScreen}       options={{ title: "Dashboard", headerBackVisible: false }} />
        <Stack.Screen name="Prediction" component={PredictionScreen} options={{ title: "🔍 Verify Signature" }} />
        <Stack.Screen name="Admin"      component={AdminScreen}      options={{ headerShown: false }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

registerRootComponent(App);
