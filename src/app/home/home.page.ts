import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { Subject, of } from 'rxjs';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule],
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
})
export class HomePage implements OnInit {
  pokemons: any[] = [];
  filteredPokemons: any[] = [];
  offset = 0;
  limit = 20;
  loading = false;
  searchTerm: string = '';
  isSearchingAPI: boolean = false;
  private searchTerms = new Subject<string>();

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit() {
    this.loadPokemons();
    
    this.searchTerms.pipe(
      debounceTime(500),
      distinctUntilChanged(),
      switchMap(term => {
        if (term.length > 2) {
          this.isSearchingAPI = true;
          return this.http.get<any>(`https://pokeapi.co/api/v2/pokemon/${term.toLowerCase()}`).pipe(
            switchMap(pokeDetails => {
              const pokemonData = {
                name: pokeDetails.name,
                image: pokeDetails.sprites.front_default,
                stats: pokeDetails.stats.map((stat: any) => ({
                  name: stat.stat.name,
                  value: stat.base_stat
                }))
              };
              return of([pokemonData]);
            })
          );
        } else {
          this.isSearchingAPI = false;
          return of(this.pokemons.filter(p => 
            p.name.toLowerCase().includes(term.toLowerCase())
          ));
        }
      })
    ).subscribe(results => {
      this.filteredPokemons = results;
    });
  }

  search(event: Event): void {
    const term = (event as CustomEvent).detail.value || '';
    this.searchTerms.next(term);
  }

  loadPokemons(event?: any) {
    if (this.loading || this.isSearchingAPI) {
      if (event) event.target.complete();
      return;
    }

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
            if (!this.isSearchingAPI) {
              this.filteredPokemons = [...this.pokemons];
            }
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