import React, { useEffect, useState, ChangeEvent, FormEvent } from 'react';
import { Link, useHistory } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';
import { Map, TileLayer, Marker } from 'react-leaflet';
import { LeafletMouseEvent } from 'leaflet';

import logo from '../../assets/logo.svg';
import './styles.css';

import { apiColeta, apiIBGE, apiGoogleMaps } from '../../services';
import DropZone from '../../components/DropZone';

interface GoogleMapsResponse {
    results: {
        address_components: {
            long_name: string,
            short_name: string,
            types: string[]
        }[]
    }[]
}

interface Item {
    id: number,
    title: string,
    image_url: string
}

interface IbgeUfResponse {
    sigla: string
}

interface IbgeCityResponse {
    nome: string
}

const CreatePoint = () => {
    const [items, setItems] = useState<Item[]>([]);
    const [ufs, setUfs] = useState<string[]>([]);
    const [cities, setCities] = useState<string[]>([]);

    const [selectedUf, setSelectedUf] = useState<string>('0');
    const [selectedCity, setSelectedCity] = useState<string>('0');
    const [selectedItems, setSelectedItems] = useState<number[]>([]);
    const [selectedPosition, setSelectedPosition] = useState<[number, number]>([0, 0]);
    const [selectedFile, setSelectedFile] = useState<File>();

    const [initialPosition, setInitialPosition] = useState<[number, number]>([0, 0]);

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        whatsapp: ''
    });

    const history = useHistory();

    useEffect(() => {
        navigator.geolocation.getCurrentPosition(position => {
            const { latitude, longitude } = position.coords;
            setInitialPosition([latitude, longitude]);
        });
    })

    useEffect(
        () => {
            apiColeta.get('items')
                .then(response => setItems(response.data))
                .catch(error => alert(error))
        },
        []
    );

    useEffect(
        () => {
            apiIBGE.get<IbgeUfResponse[]>('localidades/estados')
                .then(response => {
                    const ufInitials = response.data.map(uf => uf.sigla);
                    setUfs(ufInitials.sort());
                })
                .catch(error => alert(error))
        },
        []);

    useEffect(
        () => {
            if (selectedUf === '0')
                return;

            apiIBGE.get<IbgeCityResponse[]>(`localidades/estados/${selectedUf}/municipios`)
                .then(response => {
                    const cityNames = response.data.map(city => city.nome);
                    setCities(cityNames.sort());
                })
                .catch(error => alert(error))
        },
        [selectedUf]);

    useEffect(
        () => {
            if (selectedPosition[0] === 0 || selectedPosition[1] === 0)
                return;

            apiGoogleMaps.get<GoogleMapsResponse>(`json?key=AIzaSyC4LAQqfbhxbWl-8x5IdBLYw3gCYAmT-Bw&latlng=${selectedPosition[0]},${selectedPosition[1]}`)
                .then(response => {
                    console.log(response.data.results[0]);
                    response.data.results[0].address_components.map(item => {

                        if (item.types.find(type => type === 'administrative_area_level_1'))
                            setSelectedUf(item.short_name);
                        if (item.types.find(type => type === 'administrative_area_level_2'))
                            setSelectedCity(item.short_name);

                        return item;
                    });
                });
        },
        [selectedPosition]
    )

    function handleSeletecUf(event: ChangeEvent<HTMLSelectElement>) {
        setSelectedUf(event.target.value);
    }

    function handleSeletecCity(event: ChangeEvent<HTMLSelectElement>) {
        setSelectedCity(event.target.value);
    }

    function handleMapClick(event: LeafletMouseEvent) {
        setSelectedPosition([
            event.latlng.lat,
            event.latlng.lng
        ]);


    }

    function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
        const { name, value } = event.target;
        setFormData({ ...formData, [name]: value });
    }

    function handleSelectedItem(id: number) {
        if (selectedItems.includes(id))
            setSelectedItems(selectedItems.filter(x => x !== id));
        else
            setSelectedItems([...selectedItems, id]);
    }

    async function handleSubmit(event: FormEvent) {
        event.preventDefault();

        const [latitude, longitude] = selectedPosition;

        const data = new FormData();

        const { name, email, whatsapp } = formData;

        data.append('name', name);
        data.append('email', email);
        data.append('whatsapp', whatsapp);
        data.append('uf', selectedUf);
        data.append('city', selectedCity);
        data.append('latitude', String(latitude));
        data.append('longitude', String(longitude));
        data.append('items', selectedItems.join(','));
        
        if (selectedFile)
            data.append('image', selectedFile);

        await apiColeta.post('points', data)
            .then(response => {
                alert('Ponto de coleta criado!');
                history.push('');
            })
            .catch(error => { alert('Erro ao cadastrar ponto de coleta.') });
    }

    return (
        <div id="page-create-point">
            <header>
                <img src={logo} alt="Ecoleta" />
                <Link to="/">
                    <FiArrowLeft />
                    Voltar para Home
                </Link>
            </header>
            <form onSubmit={handleSubmit}>
                <h1>Casdastro do <br /> ponto de coleta</h1>

                <DropZone onFileUploaded={setSelectedFile} />

                <fieldset>
                    <legend>
                        <h2>Dados</h2>
                    </legend>
                </fieldset>
                <div className="field">
                    <label htmlFor="name">Nome da Entidade</label>
                    <input
                        onChange={handleInputChange}
                        type="text"
                        id="name"
                        name="name"
                    />
                </div>
                <div className="field-group">
                    <div className="field">
                        <label htmlFor="email">E-mail</label>
                        <input
                            onChange={handleInputChange}
                            type="email"
                            id="email"
                            name="email"
                        />
                    </div>
                    <div className="field">
                        <label htmlFor="whatsapp">Whatsapp</label>
                        <input
                            onChange={handleInputChange}
                            type="text"
                            id="whatsapp"
                            name="whatsapp"
                        />
                    </div>
                </div>
                <fieldset>
                    <legend>
                        <h2>Endereço</h2>
                        <span>Selecione o endereço no mapa</span>
                    </legend>

                    <Map
                        center={initialPosition}
                        zoom={15}
                        onClick={handleMapClick}>
                        <TileLayer
                            attribution='&amp;copy <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />

                        <Marker position={selectedPosition} />
                    </Map>

                    <div className="field-group">
                        <div className="field">
                            <label htmlFor="uf">Estado (UF)</label>
                            <select
                                value={selectedUf}
                                onChange={handleSeletecUf}
                                name="uf"
                                id="uf">
                                <option value="0">Selecione uma UF</option>
                                {ufs.map(uf => (
                                    <option key={uf} value={uf}>{uf}</option>
                                ))}
                            </select>
                        </div>
                        <div className="field">
                            <label htmlFor="city">Cidade</label>
                            <select
                                value={selectedCity}
                                onChange={handleSeletecCity}
                                name="city"
                                id="city">
                                <option value="0">Selecione uma Cidade</option>
                                {cities.map(city => (
                                    <option key={city} value={city}>{city}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </fieldset>

                <fieldset>
                    <legend>
                        <h2>Ítens de Coleta</h2>
                        <span>Selecione um ou mais itens abaixo</span>
                    </legend>
                    <ul className="items-grid">
                        {items.map(item => (
                            <li
                                key={item.id}
                                onClick={() => handleSelectedItem(item.id)}
                                className={selectedItems.includes(item.id) ? 'selected' : ''}>
                                <img src={item.image_url} alt={item.title} />
                                <span>{item.title}</span>
                            </li>
                        ))}
                    </ul>
                </fieldset>
                <button type="submit">
                    Cadastro ponto de coleta
                </button>
            </form>
        </div >
    );
};

export default CreatePoint;