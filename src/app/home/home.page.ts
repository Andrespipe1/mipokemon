import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, IonicModule],
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
})
export class HomePage implements OnInit {
  pokemons: any[] = [];
  offset = 0;
  limit = 20;
  loading = false;

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit() {
    this.loadPokemons();
  }

  loadPokemons(event?: any) {
    if (this.loading) return;
    this.loading = true;

    this.http
      .get<any>(`https://pokeapi.co/api/v2/pokemon?offset=${this.offset}&limit=${this.limit}`)
      .subscribe((res) => {
        const results = res.results;

        results.forEach((pokemon: any) => {
          this.http.get(pokemon.url).subscribe((pokeDetails: any) => {
            const pokemonData = {
              name: pokeDetails.name,
              image: pokeDetails.sprites.front_default,
              stats: pokeDetails.stats.map((stat: any) => ({
                name: stat.stat.name,
                value: stat.base_stat
              }))
            };

            this.pokemons.push(pokemonData);
          });
        });

        this.offset += this.limit;
        this.loading = false;

        if (event) {
          event.target.complete();
        }

        if (res.next === null && event) {
          event.target.disabled = true;
        }
      });
  }

  goToDetail(pokemonName: string) {
    this.router.navigate(['/pokemon-detail', pokemonName]);
  }
}
