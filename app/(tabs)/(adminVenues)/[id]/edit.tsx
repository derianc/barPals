// app/(tabs)/(adminVenues)/[id]/edit.tsx
import { useLocalSearchParams } from "expo-router";
import EditVenueScreen from "./EditVenueScreen";

export default function EditVenueScreenWrapper() {
  const params = useLocalSearchParams();

  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const name = Array.isArray(params.name) ? params.name[0] : params.name;
  const address = Array.isArray(params.address) ? params.address[0] : params.address;
  const city = Array.isArray(params.city) ? params.city[0] : params.city;
  const state = Array.isArray(params.state) ? params.state[0] : params.state;
  const owner_email = Array.isArray(params.owner_email) ? params.owner_email[0] : params.owner_email;

  return (
    <EditVenueScreen
      key={id} // ✅ Will force remount on change
      id={id ?? ""}
      name={name ?? ""}
      address={address}
      city={city}
      state={state}
      owner_email={owner_email}
    />
  );
}
