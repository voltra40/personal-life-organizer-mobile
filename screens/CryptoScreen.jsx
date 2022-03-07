import React, { useEffect, useState } from "react";
import {
	StyleSheet,
	Text,
	View,
	SafeAreaView,
	Keyboard,
	TextInput,
	TouchableOpacity,
	ScrollView,
	Pressable,
} from "react-native";
import { auth, firebase } from "../firebase";
import axios from "axios";
import * as Haptics from "expo-haptics";

const CryptoScreen = () => {
	const [cryptoList, setCryptoList] = useState([]);
	const [crypto, setCrypto] = useState("");
	const [cryptoPrices, setCryptoPrices] = useState([]);

	const user = auth.currentUser;
	const cryptoRef = firebase
		.firestore()
		.collection("users")
		.doc(user.uid)
		.collection("crypto")
		.doc("my crypto");

	useEffect(() => {
		cryptoRef.onSnapshot((response) => {
			setCryptoList(response.data().cryptos);
			console.log("current cryptos:", response.data().cryptos);
		});
	}, []);

	// updates prices on state change
	useEffect(() => {
		if (cryptoList.length > 0) {
			console.log("state change");
			prices();
		}
	}, [cryptoList]);

	const addCrypto = () => {
		if (crypto === "") return;
		// check if valid
		cryptoRef
			.update({
				cryptos: firebase.firestore.FieldValue.arrayUnion(crypto),
			})
			.then(() => {
				console.log("added", crypto, "to cryptos");
				setCrypto("");
				Keyboard.dismiss();
			})
			.catch((error) => {
				console.log(error);
			});
	};

	const deleteCrypto = (crypto) => {
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
		const copy = cryptoList;
		const index = copy.indexOf(crypto);
		copy.splice(index, 1);
		cryptoRef
			.update({ cryptos: copy })
			.then(() => console.log(crypto, "deleted"))
			.catch((error) => {
				alert(error.message);
			});
	};

	async function prices() {
		if (!cryptoList) return;
		const symbols = cryptoList.toString();
		console.log("symbols: ", symbols);
		let response = null;
		new Promise(async (resolve, reject) => {
			try {
				response = await axios.get(
					"https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest",
					{
						headers: {
							"X-CMC_PRO_API_KEY": "f963b29f-80ac-4790-903c-b9ba5e511ca4",
						},
						params: {
							symbol: symbols,
						},
					}
				);
			} catch (ex) {
				response = null;
				// error
				console.log(ex);
				reject(ex);
			}
			if (response) {
				// success
				const json = response.data.data;
				// console.log(json);
				resolve(json);
				let tempPrices = [];
				for (let symbol in json) {
					tempPrices.push(
						json[symbol].quote.USD.price.toFixed(2).toLocaleString("en-US")
					);
				}
				setCryptoPrices(tempPrices);
				console.log("crypto prices:", tempPrices);
			}
		});
	}

	function CryptoList() {
		if (!cryptoList) {
			return (
				<View>
					<Text>Loading...</Text>
				</View>
			);
		} else {
			const sortedCrypto = cryptoList.sort();

			return sortedCrypto.map((elem, index) => (
				<View style={styles.row} key={index}>
					<Pressable onLongPress={() => deleteCrypto(elem)} key={index}>
						<Text style={styles.cryptoText}> {elem}</Text>
					</Pressable>
					<View>
						<Text style={styles.cryptoText}> {cryptoPrices[index]} </Text>
					</View>
				</View>
			));
		}
	}

	return (
		<SafeAreaView style={styles.container}>
			<Text style={styles.title}>Crypto</Text>
			<View style={styles.inputContainer}>
				<TextInput
					placeholder="add a crypto"
					value={crypto}
					onChangeText={(text) => setCrypto(text)}
					style={styles.input}
				/>
				<TouchableOpacity onPress={addCrypto} style={styles.inputButton}>
					<Text style={styles.buttonText}>Add</Text>
				</TouchableOpacity>
			</View>
			<ScrollView style={styles.scrollView}>
				<CryptoList />
			</ScrollView>
		</SafeAreaView>
	);
};

export default CryptoScreen;

const styles = StyleSheet.create({
	container: {
		flex: 1,
		alignItems: "center",
		backgroundColor: "white",
	},
	title: {
		fontSize: 40,
		fontWeight: "bold",
		marginBottom: "20%",
	},
	scrollView: {
		flex: 1,
		alignSelf: "stretch",
	},
	row: {
		flexDirection: "row",
		alignSelf: "stretch",
		justifyContent: "center",
	},
	inputContainer: {
		flexDirection: "row",
		marginBottom: "10%",
		width: "80%",
	},
	input: {
		flex: 1,
		padding: "5%",
		borderWidth: 1,
		borderTopLeftRadius: 5,
		borderBottomLeftRadius: 5,
	},
	inputButton: {
		marginLeft: "auto",
		padding: "5%",
		borderTopRightRadius: 5,
		borderBottomRightRadius: 5,
		backgroundColor: "black",
	},
	buttonText: {
		color: "white",
	},
	cryptoText: {
		fontSize: 20,
	},
});
