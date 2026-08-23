package utils

import (
	"fmt"

	"github.com/bradfitz/gomemcache/memcache"
	log "github.com/sirupsen/logrus"
)

var cache *memcache.Client

type Cache struct{}

type CacheInterface interface {
	Set(key string, value []byte)
	Get(key string) ([]byte, error)
}

func InitCache() {
	cache = memcache.New("memcached:11211")
}

func (c *Cache) Set(key string, value []byte) {
	err := cache.Set(&memcache.Item{Key: key, Value: value, Expiration: 10})
	fmt.Println("SETEADO EN CACHE")

	if err != nil {
		log.Error("Error setting cache: ", err)
	}
}

func (c *Cache) Get(key string) ([]byte, error) {

	resp, err := cache.Get(key)

	if err != nil {
		log.Error("Error getting cache data: ", err)
		return []byte{}, err
	}
	fmt.Println("TRAIDO DE CACHE")
	log.Info("Retrieved data from cache")
	return resp.Value, nil
}
