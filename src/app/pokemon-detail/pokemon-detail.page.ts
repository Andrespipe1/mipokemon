import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { IonicModule } from '@ionic/angular';
import { ActivatedRoute } from '@angular/router';
import { AlertController } from '@ionic/angular';
import { FirebaseService } from '../services/firebase.service'; // Asegúrate de crear este servicio
import { FormsModule } from '@angular/forms'; // Importa FormsModule

@Component({
  selector: 'app-pokemon-detail',
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule], // Añade FormsModule
  templateUrl: './pokemon-detail.page.html',
  styleUrls: ['./pokemon-detail.page.scss'],
})
export class PokemonDetailPage implements OnInit {
  pokemon: any;
  loading = true;
  review: string = '';
  isSaving = false;

  constructor(
    private route: ActivatedRoute, 
    private http: HttpClient,
    private firebaseService: FirebaseService,
    private alertController: AlertController
  ) {}

  ngOnInit() {
    const name = this.route.snapshot.paramMap.get('name');
    this.http.get(`https://pokeapi.co/api/v2/pokemon/${name}`).subscribe((data) => {
      this.pokemon = data;
      this.loading = false;
    });
  }

  async savePokemon() {
  if (!this.review?.trim()) {
    const alert = await this.alertController.create({
      header: 'Reseña requerida',
      message: 'Debes escribir una reseña para guardar el Pokémon',
      buttons: ['OK']
    });
    await alert.present();
    return;
  }

  this.isSaving = true;
  
  const pokemonData = {
    name: this.pokemon.name,
    imageUrl: this.pokemon.sprites.front_default,
    stats: this.pokemon.stats.map((s: any) => ({
      name: s.stat.name,
      value: s.base_stat
    })),
    types: this.pokemon.types.map((t: any) => t.type.name),
    review: this.review,
    createdAt: new Date().toISOString()
  };

  const success = await this.firebaseService.savePokemon(pokemonData);
  
  if (success) {
    // Mostrar mensaje de éxito
  } else {
    // Mostrar mensaje de error
  }

  this.isSaving = false;
}
}