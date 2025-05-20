import { Injectable } from '@angular/core';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc } from 'firebase/firestore'; // Cambia estas importaciones

@Injectable({
  providedIn: 'root'
})
export class FirebaseService {
  private db; // Ahora será Firestore

  constructor() {
    const firebaseConfig = {
      apiKey: "AIzaSyBBzOJQWbSXl4acpF4BodIg3l-_YIVodio",
      authDomain: "moviles25a.firebaseapp.com",
      projectId: "moviles25a", // Solo necesitas esto para Firestore
      storageBucket: "moviles25a.firebasestorage.app",
      messagingSenderId: "591416146861",
      appId: "1:591416146861:web:ce7d1481c06d78dbc57f24"
      // Elimina databaseURL ya que no se usa en Firestore
    };
    
    const app = initializeApp(firebaseConfig);
    this.db = getFirestore(app); // Inicializa Firestore
  }

  async savePokemon(pokemonData: any) {
    try {
      const docRef = await addDoc(collection(this.db, "pokemons"), pokemonData);
      console.log("Documento guardado con ID:", docRef.id);
      return true;
    } catch (error) {
      console.error("Error al guardar:", error);
      return false;
    }
  }
}