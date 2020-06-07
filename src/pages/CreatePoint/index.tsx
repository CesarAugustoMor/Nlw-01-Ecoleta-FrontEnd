import axios from 'axios';
import { LeafletMouseEvent } from 'leaflet';
import React, {
  ChangeEvent,
  FormEvent,
  useCallback,
  useEffect,
  useState,
} from 'react';
import { FiArrowLeft } from 'react-icons/fi';
import { Map, Marker, TileLayer } from 'react-leaflet';
import { Link, useHistory } from 'react-router-dom';
import logo from '../../assets/logo.svg';
import Dropzone from '../../components/Dropzone';
import api from '../../services/api';
import './styles.css';

interface Item {
  id: number;
  title: string;
  image_url: string;
}

interface Uf {
  id: number;
  sigla: string;
  nome: string;
}

interface City {
  id: number;
  nome: string;
}

const CreatePoint: React.FC = () => {
  const [items, setItems] = useState<Item[]>([]);
  const [ufs, setUfs] = useState<Uf[]>([]);
  const [selctedUf, setSelectedUf] = useState('0');
  const [cities, setCities] = useState<City[]>([]);
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    whatsapp: '',
  });
  const [selectedCity, setSelectedCity] = useState('0');
  const [initialPosition, setInitialPosition] = useState<[number, number]>([
    0,
    0,
  ]);
  const [selectedPosition, setSelectedPosition] = useState<[number, number]>([
    0,
    0,
  ]);
  const [selectedFile, setSelectedFile] = useState<File>();

  const history = useHistory();

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(position => {
      const { latitude, longitude } = position.coords;
      setInitialPosition([latitude, longitude]);
    });
  }, []);

  useEffect(() => {
    api.get('items').then(response => {
      setItems(response.data);
    });
  }, []);

  useEffect(() => {
    axios
      .get(
        'https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome',
      )
      .then(response => {
        setUfs(response.data);
      });
  }, []);

  useEffect(() => {
    if (selctedUf === '0') {
      setCities([]);
      return;
    }
    axios
      .get(
        `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${selctedUf}/municipios`,
      )
      .then(response => {
        setCities(response.data);
      });
  }, [selctedUf]);

  const handleSelectUf = useCallback(
    (event: ChangeEvent<HTMLSelectElement>) => {
      setSelectedUf(event.target.value);
      setSelectedCity('0');
    },
    [],
  );

  const handleSelectCity = useCallback(
    (event: ChangeEvent<HTMLSelectElement>) => {
      setSelectedCity(event.target.value);
    },
    [],
  );

  const handleInputChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const { name, value } = event.target;

      setFormData({
        ...formData,
        [name]: value,
      });
    },
    [formData],
  );

  const handleSelectedItem = useCallback(
    (id: number) => {
      if (selectedItems.includes(id)) {
        setSelectedItems(selectedItems.filter(idSelected => idSelected !== id));
      } else {
        setSelectedItems([...selectedItems, id]);
      }
    },
    [selectedItems],
  );

  const handleSubmit = useCallback(
    async (event: FormEvent) => {
      event.preventDefault();
      const { name, email, whatsapp } = formData;
      const uf = ufs.find(ufFind => ufFind.id === Number(selctedUf));
      const city = selectedCity;
      const [latitude, longitude] = selectedPosition;

      const data = new FormData();

      data.append('name', name);
      data.append('email', email);
      data.append('whatsapp', whatsapp);
      data.append('city', city);
      data.append('latitude', String(latitude));
      data.append('longitude', String(longitude));
      data.append('items', selectedItems.join(','));
      if (selectedFile && uf) {
        data.append('uf', uf?.sigla);
        data.append('image', selectedFile);
      }

      await api.post('points', data);

      // eslint-disable-next-line no-alert
      alert('Ponto de coleta criado!');

      history.push('/');
    },
    [
      formData,
      history,
      selctedUf,
      selectedCity,
      selectedFile,
      selectedItems,
      selectedPosition,
      ufs,
    ],
  );

  const handleMapClick = useCallback((event: LeafletMouseEvent) => {
    setSelectedPosition([event.latlng.lat, event.latlng.lng]);
  }, []);

  return (
    <div id="page-create-point">
      <header>
        <img src={logo} alt="Ecoleta" />

        <Link to="/">
          <FiArrowLeft />
          Voltar para home
        </Link>
      </header>

      <form onSubmit={handleSubmit}>
        <h1>
          Cadastro do <br />
          ponto de coleta
        </h1>

        <Dropzone onFileUploaded={setSelectedFile} />

        <fieldset>
          <legend>
            <h2>Dados</h2>
          </legend>

          <div className="field">
            <label htmlFor="name">Nome da entidade</label>
            <input
              type="text"
              name="name"
              id="name"
              onChange={handleInputChange}
            />
          </div>

          <div className="field-group">
            <div className="field">
              <label htmlFor="email">E-mail</label>
              <input
                type="email"
                name="email"
                id="email"
                onChange={handleInputChange}
              />
            </div>
            <div className="field">
              <label htmlFor="whatsapp">WhatsApp</label>
              <input
                type="number"
                name="whatsapp"
                id="whatsapp"
                onChange={handleInputChange}
              />
            </div>
          </div>
        </fieldset>

        <fieldset>
          <legend>
            <h2>Endereço</h2>
            <span>Seleciona um endereço no mapa</span>
          </legend>

          <Map center={initialPosition} zoom={12.6} onclick={handleMapClick}>
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
                name="uf"
                id="uf"
                value={selctedUf}
                onChange={handleSelectUf}
              >
                <option value="0">Selecione um estado</option>
                {ufs.map(uf => (
                  <option key={uf.id} value={uf.id}>
                    {`${uf.sigla} - ${uf.nome}`}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="city">Cidade</label>
              <select
                name="city"
                id="city"
                value={selectedCity}
                onChange={handleSelectCity}
              >
                <option value="0">Selecione uma cidade</option>
                {cities.map(city => (
                  <option key={city.id} value={city.nome}>
                    {city.nome}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </fieldset>

        <fieldset>
          <legend>
            <h2>Itens de coleta</h2>
            <span>Seleciona um ou mais itens abaixo</span>
          </legend>
          <ul className="items-grid">
            {items.map(item => (
              <li
                key={item.id}
                onClick={() => handleSelectedItem(item.id)}
                className={selectedItems.includes(item.id) ? 'selected' : ''}
              >
                <img src={item.image_url} alt={item.title} />
                <span>{item.title}</span>
              </li>
            ))}
          </ul>
        </fieldset>
        <button type="submit">Cadastrar ponto de coleta</button>
      </form>
    </div>
  );
};

export default CreatePoint;
