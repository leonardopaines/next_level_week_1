import React, { useState, useEffect } from 'react';
import Constants from 'expo-constants';
import { Feather as Icon } from '@expo/vector-icons'
import { View, StyleSheet, TouchableOpacity, Text, ScrollView, Image, Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Emoji from 'react-native-emoji';
import MapView, { Marker } from 'react-native-maps';
import { SvgUri } from 'react-native-svg';
import * as Location from 'expo-location';
import api from '../../services/api';

interface propsItem {
  id: number;
  title: string;
  image_url: string;
}

interface propsPoint {
  id: number;
  name: string;
  imagem: string;
  latitude: number;
  longitude: number;
}

interface Params {
  uf: string;
  city: string;
}

const Points = () => {
  const route = useRoute();
  const routeParams = route.params as Params;

  const [items, setItems] = useState<propsItem[]>([]);
  const [points, setPoints] = useState<propsPoint[]>([]);
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [initialPosition, setInitialPosition] = useState<[number, number]>([0, 0]);

  useEffect(
    () => {
      api.get('items')
        .then(response => {
          setItems(response.data);
        });
    }, []);

  useEffect(() => {
    async function loadPosition() {
      const { status } = await Location.requestPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert('Ooooops...', 'Precisamos de sua permissão para obeter a localização.')
        return;
      }
      const location = await Location.getCurrentPositionAsync();
      const { latitude, longitude } = location.coords;
      setInitialPosition([latitude, longitude]);
    }
    loadPosition();
  }, []);

  useEffect(() => {
    api.get('points', {
      params: {
        city: routeParams.city,
        uf: routeParams.uf,
        items: selectedItems
      }
    }).then(response => {
      setPoints(response.data);
    })
  }, [selectedItems])


  const navigation = useNavigation();

  function handleNavigationBack() {
    navigation.goBack();
  }

  function handleNavigateToDetail(id: number) {
    navigation.navigate('Detail', { point_id: id });
  }

  function handleSelectedItem(id: number) {
    if (selectedItems.includes(id))
      setSelectedItems(selectedItems.filter(x => x !== id));
    else
      setSelectedItems([...selectedItems, id]);
  }

  return (
    <>
      <View style={styles.container}>
        <TouchableOpacity
          onPress={handleNavigationBack} >
          <Icon name="arrow-left" size={20} color="#34cb79" />
        </TouchableOpacity>
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          alignContent: 'center',
          justifyContent: 'space-between'
        }}>
          <Text style={styles.title}>Bem Vindo</Text>
          <Emoji name="smiley" style={styles.emoji} />
        </View>
        <Text style={styles.description}>Encontre no mapa um ponto de coleta.</Text>
        <View style={styles.mapContainer}>
          {initialPosition[0] !== 0 &&
            <MapView
              style={styles.map}
              loadingEnabled={initialPosition[0] === 0}
              initialRegion={{
                latitude: initialPosition[0],
                longitude: initialPosition[1],
                latitudeDelta: 0.014,
                longitudeDelta: 0.014,
              }}>
              {points.map(point =>
                (<Marker
                  key={String(point.id)}
                  onPress={() => handleNavigateToDetail(point.id)}
                  style={styles.mapMarker}
                  coordinate={{
                    latitude: point.latitude,
                    longitude: point.longitude,
                  }}>
                  <View style={styles.mapMarkerContainer}>
                    <Image style={styles.mapMarkerImage} source={{ uri: point.imagem }} />
                    <Text style={styles.mapMarkerTitle}>{point.name}</Text>
                  </View>
                </Marker>)
              )}
            </MapView>
          }
        </View>
      </View>
      <View style={styles.itemsContainer}>
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 20 }}
          horizontal
          showsHorizontalScrollIndicator={false}>
          {items.map(item => (
            <TouchableOpacity
              activeOpacity={0.6}
              key={`${item.id}`}
              style={[
                styles.item,
                selectedItems.includes(item.id) ? styles.selectedItem : {}
              ]}
              onPress={() => handleSelectedItem(item.id)}>
              <SvgUri width={42} height={42} uri={item.image_url} />
              <Text style={styles.itemTitle}>{item.title}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({

  container: {
    flex: 1,
    paddingHorizontal: 32,
    paddingTop: 20 + Constants.statusBarHeight,
  },

  title: {
    fontSize: 20,
    fontFamily: 'Ubuntu_700Bold',
    marginTop: 24,
  },

  emoji: {
    fontSize: 25,
  },

  description: {
    color: '#6C6C80',
    fontSize: 16,
    marginTop: 4,
    fontFamily: 'Roboto_400Regular',
  },

  mapContainer: {
    flex: 1,
    width: '100%',
    borderRadius: 10,
    overflow: 'hidden',
    marginTop: 16,
  },

  map: {
    width: '100%',
    height: '100%',
  },

  mapMarker: {
    width: 90,
    height: 80,
  },

  mapMarkerContainer: {
    width: 90,
    height: 70,
    backgroundColor: '#34CB79',
    flexDirection: 'column',
    borderRadius: 8,
    overflow: 'hidden',
    alignItems: 'center'
  },

  mapMarkerImage: {
    width: 90,
    height: 45,
    resizeMode: 'cover',
  },

  mapMarkerTitle: {
    flex: 1,
    fontFamily: 'Roboto_400Regular',
    color: '#FFF',
    fontSize: 13,
    lineHeight: 23,
  },

  itemsContainer: {
    flexDirection: 'row',
    marginTop: 16,
    marginBottom: 32,
  },

  item: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#eee',
    height: 120,
    width: 120,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 16,
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'space-between',

    textAlign: 'center',
  },

  selectedItem: {
    borderColor: '#34CB79',
    borderWidth: 2,
  },

  itemTitle: {
    fontFamily: 'Roboto_400Regular',
    textAlign: 'center',
    fontSize: 13,
  },
});

export default Points;