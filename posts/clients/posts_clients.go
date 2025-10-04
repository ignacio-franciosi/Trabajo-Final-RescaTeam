package clients

import (
	"context"
	"fmt"
	"posts/db"
	"posts/model"

	log "github.com/sirupsen/logrus"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type postClient struct{}

type postClientInterface interface {
	InsertPost(post model.Post) model.Post
	GetPostById(id string) (model.Post, error)
	DeletePost(post model.Post) error
	GetAllPosts(postType string) model.Posts
	UpdatePostById(id string, post model.Post) (model.Post, error)
	GetFilteredPosts(filters map[string]string) ([]model.Post, error)
	MarkPostAsResolved(id string) error
	GetAllPostsByUserId(userId int) (model.Posts, error)
	UploadImage(image model.Image) (model.Image, error)
	GetImagesByPostId(postId string) ([]model.Image, error)
	GetImageById(id string) (model.Image, error)
	DeleteImageById(imageId string) error
	DeleteAllImagesByPostId(postId string) error
	DeleteAllPostsByUserId(userId int) error
	DeleteAllImagesByUserId(userId int) error
	GetAllImagesByUserId(userId int) ([]model.Image, error)
}

var PostClient postClientInterface

func init() {
	PostClient = &postClient{}
}

func (c *postClient) InsertPost(post model.Post) model.Post {
	insertPost := post
	insertPost.PostId = primitive.NewObjectID()

	_, err := db.PostsCollection.InsertOne(context.TODO(), &insertPost)

	if err != nil {
		fmt.Println(err)
		return post
	}

	post.PostId = insertPost.PostId
	return post
}

func (c *postClient) GetPostById(id string) (model.Post, error) {
	var post model.Post

	// Convert string to ObjectID for MongoDB query
	objID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return post, fmt.Errorf("invalid post id format: %w", err)
	}

	collection := db.PostsCollection
	err = collection.FindOne(context.Background(), bson.M{"_id": objID}).Decode(&post)
	if err != nil {
		return post, err
	}

	return post, nil
}

func (c *postClient) DeletePost(post model.Post) error {
	collection := db.PostsCollection

	// Aseguramos que el post tenga un _id válido
	if post.PostId.IsZero() {
		return fmt.Errorf("invalid post id")
	}

	// Filtro para borrar por _id
	filter := bson.M{"_id": post.PostId}

	res, err := collection.DeleteOne(context.TODO(), filter)
	if err != nil {
		log.Debug("Failed to delete post with id:", post.PostId, "error:", err)
		return err
	}

	if res.DeletedCount == 0 {
		log.Debug("No post found with id:", post.PostId)
		return fmt.Errorf("post not found")
	}

	return nil
}

func (c *postClient) GetAllPosts(postType string) model.Posts {
	collection := db.PostsCollection

	filter := bson.M{}
	if postType != "" {
		filter["postType"] = postType
	}

	cursor, err := collection.Find(context.Background(), filter)
	if err != nil {
		log.Error("Error fetching posts: ", err)
		return model.Posts{}
	}
	defer cursor.Close(context.Background())

	var posts model.Posts
	if err := cursor.All(context.Background(), &posts); err != nil {
		log.Error("Error decoding posts: ", err)
		return model.Posts{}
	}
	return posts
}

func (c *postClient) UpdatePostById(id string, post model.Post) (model.Post, error) {
	collection := db.PostsCollection

	// Convert string to ObjectID for MongoDB query
	objID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return model.Post{}, fmt.Errorf("invalid post id format: %w", err)
	}

	// Buscar si existe el post
	var existing model.Post
	err = collection.FindOne(context.TODO(), bson.M{"_id": objID}).Decode(&existing)
	if err != nil {
		return model.Post{}, err
	}

	// Actualizar solo los campos enviados (merge)
	update := bson.M{
		"$set": post,
	}

	_, err = collection.UpdateOne(context.TODO(), bson.M{"_id": objID}, update)
	if err != nil {
		return model.Post{}, err
	}

	// Retornamos el post actualizado con el ID correcto
	post.PostId = objID
	return post, nil
}

func (c *postClient) GetFilteredPosts(filters map[string]string) ([]model.Post, error) {
	collection := db.PostsCollection

	// Armamos el filtro dinámico
	filter := bson.M{}

	for key, value := range filters {
		switch key {
		case "species", "size", "sex", "zone", "postType", "healthStatus", "collarColor", "breed":
			// Case-insensitive regex match
			filter[key] = bson.M{"$regex": value, "$options": "i"}

		case "neutered", "completeVaccines":
			filter[key] = (value == "true")

		case "age":
			switch value {
			case "0-1":
				filter["age"] = bson.M{"$gte": 0, "$lte": 1}
			case "2-3":
				filter["age"] = bson.M{"$gte": 2, "$lte": 3}
			case "4-7":
				filter["age"] = bson.M{"$gte": 4, "$lte": 7}
			case "8plus":
				filter["age"] = bson.M{"$gte": 8}
			}
		}
	}

	// Ejecutamos la query en Mongo
	cursor, err := collection.Find(context.TODO(), filter)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(context.TODO())

	var posts []model.Post
	if err := cursor.All(context.TODO(), &posts); err != nil {
		return nil, err
	}

	return posts, nil
}

func (c *postClient) MarkPostAsResolved(id string) error {
	// Convertimos el string a ObjectID
	objID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return fmt.Errorf("invalid post id: %w", err)
	}

	// Actualizamos el campo
	filter := bson.M{"_id": objID}
	update := bson.M{"$set": bson.M{"postStatus": true}}

	res, err := db.PostsCollection.UpdateOne(context.TODO(), filter, update)
	if err != nil {
		return fmt.Errorf("failed to update post: %w", err)
	}

	if res.MatchedCount == 0 {
		return fmt.Errorf("post not found")
	}

	return nil
}

func (c *postClient) GetAllPostsByUserId(userId int) (model.Posts, error) {
	var posts model.Posts

	collection := db.PostsCollection
	filter := bson.M{"userId": userId}

	cursor, err := collection.Find(context.TODO(), filter)
	if err != nil {
		log.Error("Error fetching posts by user: ", err)
		return model.Posts{}, err
	}
	defer cursor.Close(context.TODO())

	if err := cursor.All(context.TODO(), &posts); err != nil {
		log.Error("Error decoding posts: ", err)
		return model.Posts{}, err
	}

	return posts, nil
}

func (c *postClient) UploadImage(image model.Image) (model.Image, error) {
	// Generate ObjectID for the image
	image.ImageId = primitive.NewObjectID()

	_, err := db.ImagesCollection.InsertOne(context.TODO(), image)
	return image, err
}

func (c *postClient) GetImagesByPostId(postId string) ([]model.Image, error) {
	collection := db.ImagesCollection

	filter := bson.M{"postId": postId}

	cursor, err := collection.Find(context.Background(), filter)
	if err != nil {
		log.Error("Error fetching images by postId: ", err)
		return nil, err
	}
	defer cursor.Close(context.Background())

	var images []model.Image
	if err := cursor.All(context.Background(), &images); err != nil {
		log.Error("Error decoding images: ", err)
		return nil, err
	}

	return images, nil
}

func (c *postClient) GetImageById(id string) (model.Image, error) {
	collection := db.ImagesCollection

	// Convert string to ObjectID for MongoDB query
	objID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return model.Image{}, fmt.Errorf("invalid image id format: %w", err)
	}

	var image model.Image
	err = collection.FindOne(context.Background(), bson.M{"_id": objID}).Decode(&image)
	if err != nil {
		return model.Image{}, err
	}

	return image, nil
}

func (c *postClient) DeleteImageById(imageId string) error {
	collection := db.ImagesCollection

	// Convert string to ObjectID for MongoDB query
	objID, err := primitive.ObjectIDFromHex(imageId)
	if err != nil {
		return fmt.Errorf("invalid image id format: %w", err)
	}

	_, err = collection.DeleteOne(context.Background(), bson.M{"_id": objID})
	return err
}

func (c *postClient) DeleteAllImagesByPostId(postId string) error {
	collection := db.ImagesCollection

	_, err := collection.DeleteMany(context.Background(), bson.M{"postId": postId})
	return err
}

func (c *postClient) DeleteAllPostsByUserId(userId int) error {
	collection := db.PostsCollection
	_, err := collection.DeleteMany(context.Background(), bson.M{"userId": userId})
	return err
}

func (c *postClient) DeleteAllImagesByUserId(userId int) error {
	collection := db.ImagesCollection
	_, err := collection.DeleteMany(context.Background(), bson.M{"userId": userId})
	return err
}

func (c *postClient) GetAllImagesByUserId(userId int) ([]model.Image, error) {
	collection := db.ImagesCollection

	filter := bson.M{"userId": userId}

	cursor, err := collection.Find(context.Background(), filter)
	if err != nil {
		log.Error("Error fetching images by postId: ", err)
		return nil, err
	}
	defer cursor.Close(context.Background())

	var images []model.Image
	if err := cursor.All(context.Background(), &images); err != nil {
		log.Error("Error decoding images: ", err)
		return nil, err
	}

	return images, nil
}
